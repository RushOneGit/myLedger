import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config-validation-schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere without re-importing
      validationSchema: configValidationSchema,
      envFilePath: ['.env'],
    }),
    HealthModule,
  ],
})
export class AppModule { }
