import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateAccountDto } from './dtos/create-account.dto';
import { AccountService } from './account.service';
import { AccountEntity } from './account.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QueryAccountDto } from './dtos/query-account.dto';
import { FindAllEntities } from '../../common/interfaces';
import { ApiTags } from '@nestjs/swagger';
import { UpdateNameAccountDto } from './dtos/update-name-account.dto';

@ApiTags('Accounts')
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

  @Get()
  list(
    @CurrentUser() userId: string,
    @Query() query: QueryAccountDto,
  ): Promise<FindAllEntities<AccountEntity>> {
    return this.accountService.findAll(userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountEntity> {
    return this.accountService.findOne(userId, id);
  }

  @Patch(':id')
  updatedName(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNameAccountDto,
  ): Promise<AccountEntity> {
    return this.accountService.updateName(userId, id, dto);
  }

  @Delete(':id')
  delete(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountEntity> {
    return this.accountService.delete(userId, id);
  }
}
