import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RedisHealthService } from './redis.health.service';
import { RabbitMqHealthService } from './rabbitmq.health.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly rabbit: RabbitMqHealthService,
    private readonly redis: RedisHealthService,
  ) {}

  @Get('live')
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  ready() {
    return this.health.check([
      () => this.db.pingCheck('db', { timeout: 1500 }),
      () => this.rabbit.isHealthy('rabbitmq'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
