import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EnvironmentEnum } from './common/enums';
import { ValidationPipe } from '@nestjs/common';
import { CustomLoggerService } from './common/logger/custom-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  // custom Logger
  app.useLogger(app.get(CustomLoggerService));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT');
  const env = configService.get<string>('NODE_ENV');

  // All routes live under /api so the Vue client can proxy a single prefix.
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // Swagger initialization
  if (env !== EnvironmentEnum.Prod) {
    const config = new DocumentBuilder()
      .setTitle('Ledger')
      .setDescription('The ledger API description')
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  // Global Pipes initialization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: env === EnvironmentEnum.Prod,
      transform: true,
    }),
  );

  await app.listen(port ?? 3000);
}
void bootstrap();
