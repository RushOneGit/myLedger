import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config-validation-schema';

import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './common/redis/redis.module';
import { APP_FILTER } from '@nestjs/core';
import { CatchEverythingFilter } from './common/filters/catch-everything.filter';
import { CustomLoggerModule } from './common/logger/custom-logger.module';
import { AccountModule } from './modules/account/account.module';
import { CategoryModule } from './modules/category/category.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { CurrencyModule } from './modules/currency/currency.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere without re-importing
      validationSchema: configValidationSchema,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    HealthModule,
    UserModule,
    RedisModule,
    CustomLoggerModule,
    AccountModule,
    CategoryModule,
    TransactionModule,
    CurrencyModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
