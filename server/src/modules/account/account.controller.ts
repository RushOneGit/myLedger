import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateAccountDto } from './dtos/create-account.dto';
import { AccountService } from './account.service';
import { AccountEntity } from './account.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  createAccount(
    @CurrentUser() userId: string,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountEntity> {
    return this.accountService.create(userId, dto);
  }
}
