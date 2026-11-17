import { NotFoundException } from '@nestjs/common';
import { accountCash, buildAccountResponse } from '../../../test/fixtures/account.fixture';
import { userId } from '../../../test/fixtures/user.fixture';
import { Money } from '../../common/money';
import { AccountTypeEnum } from '../account/account.entity';
import { TransactionKindEnum } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { randomUUID } from 'node:crypto';
import { categoryData } from '../../../test/fixtures/category.fixture';

function setup() {
  const TransactionAbstractRepository = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    findOneManual: vi.fn(),
    findOneSynced: vi.fn(),
    update: vi.fn(),
  };

  const unitOfWork = {
    createManual: vi.fn(),
    updateManual: vi.fn(),
    deleteManual: vi.fn(),
  };

  const accountService = { findOne: vi.fn().mockResolvedValue(accountCash) };

  const categoryService = { findOne: vi.fn() };

  // Real Money, without the DB-backed registry
  const currencyRegistry = {
    money: (amount: string, code: string) => Money.of(amount, { code, maxScale: 2 }),
  };

  const service = new TransactionService(
    TransactionAbstractRepository,
    unitOfWork,
    accountService as never,
    categoryService as never,
    currencyRegistry as never,
  );

  return { service, TransactionAbstractRepository, unitOfWork, accountService, categoryService };
}

describe('TransactionService', () => {
  describe('Create manual', () => {
    it('passes amount 100 and delta -100 for an expense', async () => {
      const { service, unitOfWork } = setup();
      await service.createManual(userId, {
        accountId: accountCash.id,
        operationDate: '2026-11-01T10:00:00+02:00',
        kind: TransactionKindEnum.Expense,
        amount: '100',
      });

      expect(unitOfWork.createManual).toHaveBeenCalledOnce();
      const [amount, delta] = unitOfWork.createManual.mock.calls[0] as [Money, Money];
      expect(delta.toString()).toBe('-100');
      expect(amount.toString()).toBe('100');
    });

    it('passes amount 100 and delta 100 for an income', async () => {
      const { service, unitOfWork } = setup();
      await service.createManual(userId, {
        accountId: accountCash.id,
        operationDate: '2026-11-01T10:00:00+02:00',
        kind: TransactionKindEnum.Income,
        amount: '100',
      });

      expect(unitOfWork.createManual).toHaveBeenCalledOnce();
      const [amount, delta] = unitOfWork.createManual.mock.calls[0] as [Money, Money];
      expect(delta.toString()).toBe('100');
      expect(amount.toString()).toBe('100');
    });

    it('throws 404 for a non-cash account and does not call unitOfWork', async () => {
      const wrongAccount = buildAccountResponse(AccountTypeEnum.Mono);
      const { service, accountService, unitOfWork } = setup();

      accountService.findOne.mockResolvedValue(wrongAccount);

      await expect(
        service.createManual(userId, {
          accountId: wrongAccount.id,
          operationDate: '2026-11-01T10:00:00+02:00',
          kind: TransactionKindEnum.Income,
          amount: '100',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(unitOfWork.createManual).not.toHaveBeenCalled();
    });

    it('does not save when categoryService.findOne throws', async () => {
      const { service, categoryService, unitOfWork } = setup();
      categoryService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.createManual(userId, {
          accountId: accountCash.id,
          categoryId: categoryData.id,
          operationDate: '2026-11-01T10:00:00+02:00',
          kind: TransactionKindEnum.Income,
          amount: '100',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(unitOfWork.createManual).not.toHaveBeenCalled();
    });
  });

  describe('Update manual', () => {
    it('throws 404 when the transaction is not manual (findOneManual returns null)', async () => {
      const { service, TransactionAbstractRepository, unitOfWork } = setup();
      TransactionAbstractRepository.findOneManual.mockResolvedValue(null);

      await expect(
        service.updateManual(userId, 'tx-1', {
          operationDate: '2026-11-01T10:00:00+02:00',
          categoryId: categoryData.id,
          amount: '100',
          kind: TransactionKindEnum.Income,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(TransactionAbstractRepository.findOneManual).toHaveBeenCalledWith('tx-1', userId);
      expect(unitOfWork.updateManual).not.toHaveBeenCalled();
    });
    it.each([
      [TransactionKindEnum.Expense, '100', TransactionKindEnum.Income, '100', '200'],
      [TransactionKindEnum.Income, '100', TransactionKindEnum.Expense, '100', '-200'],
      [TransactionKindEnum.Expense, '100', TransactionKindEnum.Expense, '150', '-50'],
      [TransactionKindEnum.Income, '100', TransactionKindEnum.Income, '150', '50'],
      [TransactionKindEnum.Expense, '100', TransactionKindEnum.Expense, '100', '0'],
      [TransactionKindEnum.Expense, '0.2', TransactionKindEnum.Income, '0.5', '0.7'],
    ])('%s %s -> %s %s gives %s', async (oldKind, oldAmount, newKind, newAmount, deltaResult) => {
      const { service, TransactionAbstractRepository, unitOfWork } = setup();
      const id = `tx-${randomUUID()}`;
      TransactionAbstractRepository.findOneManual.mockResolvedValue({
        id,
        accountId: accountCash.id,
        kind: oldKind,
        amount: oldAmount,
      });

      await service.updateManual(userId, id, {
        operationDate: '2026-11-01T10:00:00+02:00',
        amount: newAmount,
        kind: newKind,
      });

      expect(unitOfWork.updateManual).toHaveBeenCalledOnce();
      const delta = unitOfWork.updateManual.mock.calls[0]?.[4] as Money;

      expect(delta.toString()).toBe(deltaResult);
    });
  });

  describe('Update category', () => {
    it('sets categoryManual: true', async () => {
      const { service, TransactionAbstractRepository } = setup();
      const exists = {
        id: 'tx-1',
        categoryId: categoryData.id,
        categoryManual: false,
      };
      TransactionAbstractRepository.findOneSynced.mockResolvedValue(exists);

      await service.updateCategory(userId, 'tx-1', {
        categoryId: categoryData.id,
      });

      expect(TransactionAbstractRepository.update).toHaveBeenCalledWith(
        exists,
        expect.objectContaining({ categoryManual: true }),
      );
    });

    it('stores null when categoryId is omitted', async () => {
      const { service, TransactionAbstractRepository } = setup();
      const exists = {
        id: 'tx-1',
        categoryId: categoryData.id,
        categoryManual: false,
      };
      TransactionAbstractRepository.findOneSynced.mockResolvedValue(exists);

      await service.updateCategory(userId, 'tx-1', {});

      expect(TransactionAbstractRepository.update).toHaveBeenCalledWith(
        exists,
        expect.objectContaining({ categoryId: null }),
      );
    });

    it("does not update when the category is another user's or archived", async () => {
      const { service, TransactionAbstractRepository, categoryService } = setup();
      TransactionAbstractRepository.findOneSynced.mockResolvedValue({
        id: 'tx-1',
        categoryManual: false,
      });
      categoryService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.updateCategory(userId, 'tx-1', { categoryId: categoryData.id }),
      ).rejects.toThrow(NotFoundException);

      expect(categoryService.findOne).toHaveBeenCalledWith(userId, categoryData.id);
      expect(TransactionAbstractRepository.update).not.toHaveBeenCalled();
    });

    it('throws 404 when the transaction is not synced', async () => {
      const { service, TransactionAbstractRepository } = setup();
      TransactionAbstractRepository.findOneSynced.mockResolvedValue(null);

      await expect(service.updateCategory(userId, 'tx-1', {})).rejects.toThrow(NotFoundException);

      expect(TransactionAbstractRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Delete manual', () => {
    it.each([
      [TransactionKindEnum.Expense, '100', '-100'],
      [TransactionKindEnum.Income, '100', '100'],
    ])(
      "passes the %s's signed effect to unitOfWork (it decrements it)",
      async (kind, amount, deltaResult) => {
        const { service, TransactionAbstractRepository, unitOfWork } = setup();
        const id = `tx-${randomUUID()}`;
        TransactionAbstractRepository.findOneManual.mockResolvedValue({
          id,
          accountId: accountCash.id,
          amount,
          kind,
        });
        unitOfWork.deleteManual.mockResolvedValue(true);

        await service.deleteManual(userId, id);

        expect(unitOfWork.deleteManual).toHaveBeenCalledOnce();
        const delta = unitOfWork.deleteManual.mock.calls[0]?.[2] as Money;
        expect(delta.toString()).toBe(deltaResult);
      },
    );

    it('throws 404 when unitOfWork.deleteManual returns false', async () => {
      const { service, TransactionAbstractRepository, unitOfWork } = setup();
      TransactionAbstractRepository.findOneManual.mockResolvedValue({
        id: 'tx-1',
        accountId: accountCash.id,
        amount: '100',
        kind: TransactionKindEnum.Expense,
      });
      unitOfWork.deleteManual.mockResolvedValue(false);

      await expect(service.deleteManual(userId, 'tx-1')).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when the transaction is not manual and does not call unitOfWork', async () => {
      const { service, TransactionAbstractRepository, unitOfWork } = setup();
      TransactionAbstractRepository.findOneManual.mockResolvedValue(null);

      await expect(service.deleteManual(userId, 'tx-1')).rejects.toThrow(NotFoundException);

      expect(unitOfWork.deleteManual).not.toHaveBeenCalled();
    });
  });
});
