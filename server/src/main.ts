import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // All routes live under /api so the Vue client can proxy a single prefix.
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(process.env['PORT'] ?? 3000);
}
void bootstrap();
