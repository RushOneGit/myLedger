import { Controller, Get } from '@nestjs/common';
import {
  type HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthService } from './redis.health.service';
import { RabbitMqHealthService } from './rabbitmq.health.service';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly rabbit: RabbitMqHealthService,
    private readonly redis: RedisHealthService,
  ) {}

  @Get('live')
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('db', { timeout: 1500 }),
      () => this.rabbit.isHealthy('rabbitmq'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
