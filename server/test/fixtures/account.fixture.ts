import { randomUUID } from 'crypto';
import { userId } from './user.fixture';
import { AccountTypeEnum, type AccountEntity } from '../../src/modules/account/account.entity';

export const accountCash = {
  id: randomUUID(),
  userId,
  name: `account-cash-${randomUUID()}`,
  balance: '',
  type: AccountTypeEnum.Cash,
  currencyCode: 'UAH',
  archivedFlag: false,
} as AccountEntity;

export function buildAccountResponse(type: AccountTypeEnum, balance: string = '100') {
  return {
    id: randomUUID(),
    userId,
    name: `account-cash-${randomUUID()}`,
    balance,
    type,
    currencyCode: 'UAH',
    archivedFlag: false,
  };
}
