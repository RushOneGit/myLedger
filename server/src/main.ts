import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EnvironmentEnum } from './enums';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT');
  // All routes live under /api so the Vue client can proxy a single prefix.
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // Swagger initialization
  if (configService.get('NODE_ENV') !== EnvironmentEnum.Prod) {
    const config = new DocumentBuilder()
      .setTitle('Ledger')
      .setDescription('The ledger API description')
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  await app.listen(port ?? 3000);
}
void bootstrap();
