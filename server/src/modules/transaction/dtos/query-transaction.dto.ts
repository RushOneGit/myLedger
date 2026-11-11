import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { SourceTransactionEnum, TransactionKindEnum } from '../transaction.entity';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIsoMoment } from '../../../common/decorators/is-iso-moment.decorator';
import { IsPositiveAmount } from '../../../common/decorators/is-positive-amount.decorator';

const SORT_ITEMS = ['createdAt', 'kind', 'operationDate', 'id'];
const SORTED_LIST = SORT_ITEMS.flatMap((item) => [`${item}:ASC`, `${item}:DESC`]);

export class QueryTransactionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositiveAmount()
  amount?: string;

  @ApiPropertyOptional({ enum: TransactionKindEnum })
  @IsOptional()
  @IsEnum(TransactionKindEnum)
  kind?: TransactionKindEnum;

  @ApiPropertyOptional({ enum: SourceTransactionEnum })
  @IsOptional()
  @IsEnum(SourceTransactionEnum)
  source?: SourceTransactionEnum;

  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  @IsOptional()
  uncategorized?: boolean;

  @ApiPropertyOptional({ enum: SORTED_LIST, isArray: true })
  @Transform(({ value }: { value: unknown }): unknown[] => (Array.isArray(value) ? value : [value]))
  @IsIn(SORTED_LIST, { each: true })
  @IsOptional()
  sort?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsIsoMoment()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIsoMoment()
  to?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
