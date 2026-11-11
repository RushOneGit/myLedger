import { PickType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateManualTransactionDto extends PickType(CreateTransactionDto, [
  'operationDate',
  'description',
  'categoryId',
  'amount',
  'kind',
]) {}
