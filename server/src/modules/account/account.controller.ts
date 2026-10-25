import { Body, Controller, Post } from '@nestjs/common';
import { CreateAccountDto } from './dtos/create-account.dto';
import { AccountService } from './account.service';
import { AccountEntity } from './account.entity';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Post()
  createAccount(@Body() dto: CreateAccountDto): Promise<AccountEntity> {
    return this.accountService.create(dto);
  }

  // @Get()
  // async listCash() {}
}
