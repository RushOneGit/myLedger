import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthService } from './redis.health.service';
import { RabbitMqHealthService } from './rabbitmq.health.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthService, RabbitMqHealthService],
})
export class HealthModule {}
