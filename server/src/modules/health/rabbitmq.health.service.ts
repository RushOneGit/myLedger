import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { connect } from 'amqplib';

// Plain amqplib instead of terminus' MicroserviceHealthIndicator: its ClientRMQ.close()
// closes channel and connection concurrently and the channel close never resolves.
@Injectable()
export class RabbitMqHealthService {
  constructor(
    private readonly health: HealthIndicatorService,
    private readonly config: ConfigService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key);
    const url =
      `amqp://${this.config.getOrThrow<string>('RABBITMQ_USER')}:${this.config.getOrThrow<string>('RABBITMQ_PASSWORD')}` +
      `@${this.config.getOrThrow<string>('RABBITMQ_HOST')}:${String(this.config.getOrThrow<string | number>('RABBITMQ_PORT'))}`;
    try {
      const conn = await connect(url, { timeout: 1500 });
      await conn.close();
      return indicator.up();
    } catch (e) {
      return indicator.down({ message: (e as Error).message });
    }
  }
}
