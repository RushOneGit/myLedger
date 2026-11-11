import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AccountTypeEnum } from '../account.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

const SORTED_ITEMS = ['createdAt', 'name'];
const SORTED_LIST = SORTED_ITEMS.flatMap((item) => [`${item}:ASC`, `${item}:DESC`]);

export class QueryAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsEnum(AccountTypeEnum)
  @IsOptional()
  type?: AccountTypeEnum;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  @IsOptional()
  archivedFlag?: boolean = false;

  @ApiPropertyOptional({ enum: SORTED_LIST, isArray: true })
  @Transform(({ value }: { value: unknown }): unknown[] => (Array.isArray(value) ? value : [value]))
  @IsIn(SORTED_LIST, { each: true })
  @IsOptional()
  sort?: string[];

  @ApiPropertyOptional({ type: Number, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
