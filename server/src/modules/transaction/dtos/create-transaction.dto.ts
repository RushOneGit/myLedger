import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionKindEnum } from '../transaction.entity';
import { IsIsoMoment } from '../../../common/decorators/is-iso-moment.decorator';
import { IsPositiveAmount } from '../../../common/decorators/is-positive-amount.decorator';

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Omit or send null for an uncategorized transaction',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsIsoMoment()
  operationDate: string;

  @ApiProperty({ example: '150.50', description: 'Positive amount; the sign comes from `kind`' })
  @IsPositiveAmount()
  amount: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalCurrencyCode?: string;

  // Transfers are created through their own flow (two linked rows), not here.
  @ApiProperty({ enum: [TransactionKindEnum.Income, TransactionKindEnum.Expense] })
  @IsIn([TransactionKindEnum.Income, TransactionKindEnum.Expense])
  kind: TransactionKindEnum;
}
