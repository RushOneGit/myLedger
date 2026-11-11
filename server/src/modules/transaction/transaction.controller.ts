import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionEntity } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { FindAllEntities } from '../../common/interfaces';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { QueryTransactionDto } from './dtos/query-transaction.dto';
import { UpdateManualTransactionDto } from './dtos/update-manual-transaction.dto';
import { UpdateCategoryTransactionDto } from './dtos/update-category-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Transactions')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(
    @CurrentUser() userId: string,
    @Query() query: QueryTransactionDto,
  ): Promise<FindAllEntities<TransactionEntity>> {
    return this.transactionService.findAll(userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionEntity> {
    return this.transactionService.findOne(userId, id);
  }

  @Post()
  createCash(
    @CurrentUser() userId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionEntity> {
    return this.transactionService.createCash(userId, dto);
  }

  @Put('/manual/:id')
  updateManualTransaction(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateManualTransactionDto,
  ): Promise<TransactionEntity> {
    return this.transactionService.updateManual(userId, id, dto);
  }

  @Put('/category/:id')
  updateCategoryTransaction(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryTransactionDto,
  ): Promise<TransactionEntity> {
    return this.transactionService.updateCategory(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteManualTransaction(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.transactionService.deleteManual(userId, id);
  }
}
