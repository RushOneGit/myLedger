import { PickType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateCategoryTransactionDto extends PickType(CreateTransactionDto, ['categoryId']) {}
