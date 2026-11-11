import { type INestApplication } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import request from 'supertest';
import { type App } from 'supertest/types';
import { UserEntity } from '../src/modules/user/user.entity';
import { AccountEntity } from '../src/modules/account/account.entity';
import { createApp } from './helpers/create-app';
import { createUser, type TestUser } from './helpers/create-user';
import { buildCreateTransaction } from './fixtures/transaction.fixture';
import {
  TransactionEntity,
  TransactionKindEnum,
} from '../src/modules/transaction/transaction.entity';
import { randomUUID } from 'crypto';

describe('Transactions e2e', () => {
  let app: INestApplication<App>;

  let owner: TestUser;
  let stranger: TestUser;

  const accountCurrency = 'UAH';
  const accountIds: string[] = [];

  const createAccount = async (user: TestUser): Promise<string> => {
    const rs = await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: `account-${randomUUID()}`, currencyCode: accountCurrency })
      .expect(201);
    const id = rs.body.id as string;
    accountIds.push(id);
    return id;
  };

  const createTransaction = async (
    user: TestUser,
    body: Record<string, unknown>,
  ): Promise<string> => {
    const rs = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(body)
      .expect(201);
    return rs.body.id as string;
  };

  const list = async (
    user: TestUser,
    query: Record<string, string>,
  ): Promise<{ ids: string[]; count: number }> => {
    const rs = await request(app.getHttpServer())
      .get('/api/transactions')
      .query(query)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    return {
      ids: (rs.body.data as { id: string }[]).map((t) => t.id),
      count: rs.body.count as number,
    };
  };

  beforeAll(async () => {
    app = await createApp();

    owner = await createUser(app);
    stranger = await createUser(app);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    // Children first: transactions → accounts → users (all FKs are RESTRICT).
    // Repository.delete is a hard delete, so soft-deleted rows go too.
    await dataSource.getRepository(TransactionEntity).delete({ accountId: In(accountIds) });
    await dataSource.getRepository(AccountEntity).delete({ id: In(accountIds) });
    await dataSource.getRepository(UserEntity).delete({ email: In([owner.email, stranger.email]) });

    await app.close();
  });

  describe('validation', () => {
    let accountId: string;

    beforeAll(async () => {
      accountId = await createAccount(owner);
    });

    it('valid body → 201', async () => {
      await createTransaction(owner, buildCreateTransaction(accountId));
    });

    it.each([
      ['bare date', { operationDate: '2026-11-01' }],
      ['date time without offset', { operationDate: '2026-11-01T10:00:00' }],
      ['negative amount', { amount: '-50.00' }],
      ['zero amount', { amount: '0' }],
      ['malformed amount', { amount: 'xyz' }],
      // Passes the DTO regex, rejected by Money (UAH max_scale = 2) → mapped to 400 by the filter
      ['too many decimals for UAH', { amount: '1.123' }],
      ['Transfer kind', { kind: TransactionKindEnum.Transfer }],
      ['unknown field', { balance: '1000' }],
    ])('create with %s → 400', async (_name, override) => {
      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        // Spread instead of the fixture's typed overrides: some rows send fields the DTO doesn't have.
        .send({ ...buildCreateTransaction(accountId), ...override })
        .expect(400);
    });

    it.each([
      ['from without offset', { from: '2026-11-01', to: '2026-11-02T00:00:00Z' }],
      ['from after to', { from: '2026-11-02T00:00:00Z', to: '2026-11-01T00:00:00Z' }],
      ['malformed amount', { amount: 'abc' }],
      ['removed categoryName filter', { categoryName: 'Food' }],
    ])('list with %s → 400', async (_name, query) => {
      await request(app.getHttpServer())
        .get('/api/transactions')
        .query(query)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(400);
    });

    it.each([
      ['get', 'get', '/api/transactions/not-a-uuid'],
      ['update', 'put', '/api/transactions/manual/not-a-uuid'],
      ['delete', 'delete', '/api/transactions/not-a-uuid'],
      ['account', 'get', '/api/accounts/not-a-uuid'],
    ] as const)('%s with non-UUID id → 400', async (_n, method, url) => {
      await request(app.getHttpServer())
        [method](url)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(400);
    });
  });

  describe('ownership', () => {
    let accountId: string;
    let transactionId: string;

    beforeAll(async () => {
      accountId = await createAccount(owner);
      // No categoryId → uncategorized, so the OR filter below has something to leak.
      transactionId = await createTransaction(owner, buildCreateTransaction(accountId));
    });

    it("stranger gets 404 on someone else's transaction", async () => {
      await request(app.getHttpServer())
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .expect(404);
    });

    it("stranger can't update or delete it", async () => {
      await request(app.getHttpServer())
        .put(`/api/transactions/manual/${transactionId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({
          amount: '1.00',
          kind: TransactionKindEnum.Income,
          operationDate: '2026-11-01T10:00:00Z',
        })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .expect(404);
    });

    it("stranger can't post into someone else's account", async () => {
      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send(buildCreateTransaction(accountId))
        .expect(404);
    });

    // Functions, because accountId is only known after beforeAll has run.
    it.each<[string, () => Record<string, string>]>([
      ['no filters', () => ({})],
      ['uncategorized=true', () => ({ uncategorized: 'true' })],
      ["the owner's accountId", () => ({ accountId })],
      ['categoryId OR uncategorized', () => ({ uncategorized: 'true', categoryId: randomUUID() })],
    ])("stranger's list with %s shows none of the owner's rows", async (_name, query) => {
      const { ids, count } = await list(stranger, query());
      expect(ids).not.toContain(transactionId);
      expect(count).toBe(0);
    });

    it('owner sees the row with uncategorized=true', async () => {
      const { ids } = await list(owner, { uncategorized: 'true', accountId });
      expect(ids).toContain(transactionId);
    });
  });

  describe('pagination', () => {
    let accountId: string;
    const created: string[] = [];

    beforeAll(async () => {
      accountId = await createAccount(owner);
      // Same operationDate on purpose: only the id tiebreaker keeps the order stable.
      for (let i = 0; i < 3; i++) {
        created.push(await createTransaction(owner, buildCreateTransaction(accountId)));
      }
    });

    it('pages with limit=1 cover every row exactly once', async () => {
      const seen: string[] = [];
      for (let page = 1; page <= 3; page++) {
        const { ids, count } = await list(owner, { accountId, limit: '1', page: String(page) });
        expect(count).toBe(3);
        expect(ids).toHaveLength(1);
        seen.push(...ids);
      }
      expect(new Set(seen).size).toBe(3);
      expect(seen.sort()).toEqual([...created].sort());
    });

    it('page past the end is empty but keeps the total count', async () => {
      const { ids, count } = await list(owner, { accountId, limit: '1', page: '4' });
      expect(ids).toEqual([]);
      expect(count).toBe(3);
    });
  });

  describe('delete', () => {
    it('owner deletes a manual transaction → 204, then it is gone', async () => {
      const accountId = await createAccount(owner);
      const id = await createTransaction(owner, buildCreateTransaction(accountId));

      await request(app.getHttpServer())
        .delete(`/api/transactions/${id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/transactions/${id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(404);
    });
  });
});
