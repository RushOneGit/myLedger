import { TransactionKindEnum } from '../../modules/transaction/transaction.entity';
import { type Money } from './money';

export function signedAmount(kind: TransactionKindEnum, amount: Money): Money {
  return kind === TransactionKindEnum.Income ? amount : amount.negate();
}
