import { type INestApplication } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import request from 'supertest';
import { type App } from 'supertest/types';
import { UserEntity } from '../src/modules/user/user.entity';
import { AccountEntity } from '../src/modules/account/account.entity';
import { createApp } from './helpers/create-app';
import { createUser, type TestUser } from './helpers/create-user';
import { randomUUID } from 'crypto';

describe('Accounts e2e', () => {
  let app: INestApplication<App>;

  let owner: TestUser;
  let stranger: TestUser;

  const accountCurrency = 'UAH';
  // Every account this spec creates, so afterAll can remove them before the users (FK RESTRICT).
  const createdNames: string[] = [];

  const uniqueName = (): string => {
    const name = `account-${randomUUID()}`;
    createdNames.push(name);
    return name;
  };

  const createAccount = async (user: TestUser, name: string): Promise<request.Response> =>
    request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name, currencyCode: accountCurrency });

  beforeAll(async () => {
    app = await createApp();

    owner = await createUser(app);
    stranger = await createUser(app);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.getRepository(AccountEntity).delete({ name: In(createdNames) });
    await dataSource.getRepository(UserEntity).delete({ email: In([owner.email, stranger.email]) });

    await app.close();
  });

  describe('create and read', () => {
    let accountId: string;
    const name = uniqueName();

    it('creates a cash account', async () => {
      const rs = await createAccount(owner, name);
      expect(rs.status).toBe(201);
      expect(rs.body).toMatchObject({ name, currencyCode: accountCurrency, type: 'Cash' });
      accountId = rs.body.id;
    });

    it('owner can read it', async () => {
      await request(app.getHttpServer())
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
    });

    it("stranger gets 404 on someone else's account", async () => {
      await request(app.getHttpServer())
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .expect(404);
    });

    it("stranger can't rename or archive it", async () => {
      await request(app.getHttpServer())
        .patch(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .send({ name: uniqueName() })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${stranger.accessToken}`)
        .expect(404);
    });

    it('another user may use the same name (uniqueness is per user)', async () => {
      const rs = await createAccount(stranger, name);
      expect(rs.status).toBe(201);
    });
  });

  describe('name uniqueness', () => {
    it('duplicate name on create → 409', async () => {
      const name = uniqueName();
      expect((await createAccount(owner, name)).status).toBe(201);
      expect((await createAccount(owner, name)).status).toBe(409);
    });

    it('rename to an existing name → 409', async () => {
      const taken = uniqueName();
      expect((await createAccount(owner, taken)).status).toBe(201);

      const other = await createAccount(owner, uniqueName());
      expect(other.status).toBe(201);

      await request(app.getHttpServer())
        .patch(`/api/accounts/${other.body.id as string}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: taken })
        .expect(409);
    });
  });

  describe('archiving', () => {
    let archivedId: string;
    const name = uniqueName();

    beforeAll(async () => {
      const rs = await createAccount(owner, name);
      archivedId = rs.body.id;

      await request(app.getHttpServer())
        .delete(`/api/accounts/${archivedId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
    });

    const listIds = async (query: Record<string, string> = {}): Promise<string[]> => {
      const rs = await request(app.getHttpServer())
        .get('/api/accounts')
        .query({ limit: '100', ...query })
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      return (rs.body.data as { id: string }[]).map((a) => a.id);
    };

    it('archived account is hidden from the default list', async () => {
      expect(await listIds()).not.toContain(archivedId);
    });

    it('archived account is listed with archivedFlag=true', async () => {
      expect(await listIds({ archivedFlag: 'true' })).toContain(archivedId);
    });

    it('name of an archived account can be reused (partial unique index)', async () => {
      expect((await createAccount(owner, name)).status).toBe(201);
    });
  });
});
