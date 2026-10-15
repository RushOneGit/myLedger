import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.module';

@Injectable()
export class RedisHealthService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly health: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.health.check(key);
    try {
      const pong = await this.redis.ping(); // Redis answers "PONG"
      return pong === 'PONG' ? indicator.up() : indicator.down({ reason: 'unexpected reply' });
    } catch (e) {
      return indicator.down({ message: (e as Error).message });
    }
  }
}
