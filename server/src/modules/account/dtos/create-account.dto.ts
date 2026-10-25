import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccountTypeEnum } from '../account.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    example: 'Cash',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({
    enum: AccountTypeEnum,
    enumName: 'AccountTypeEnum',
    example: AccountTypeEnum.Cash,
  })
  @IsEnum(AccountTypeEnum)
  type: AccountTypeEnum;

  @ApiProperty()
  @IsString()
  currencyCode: string;

  @ApiProperty({
    default: 'false',
  })
  @IsOptional()
  @IsBoolean()
  archivedFlag?: boolean = false;
}
