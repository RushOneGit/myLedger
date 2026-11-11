import { Inject, Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS } from '../../common/redis/redis.module';

@Injectable()
export class RedisHealthService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly health: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key);
    try {
      // ioredis types ping() as Promise<'PONG'>; any failure arrives as a rejection.
      await this.redis.ping();
      return indicator.up();
    } catch (e) {
      return indicator.down({ message: (e as Error).message });
    }
  }
}
