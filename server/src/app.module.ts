import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config-validation-schema';

import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './redis/redis.module';

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
  ],
})
export class AppModule {}
