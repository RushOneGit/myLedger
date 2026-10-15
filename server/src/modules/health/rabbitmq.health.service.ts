import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { connect } from 'amqplib';

// Plain amqplib instead of terminus' MicroserviceHealthIndicator: its ClientRMQ.close()
// closes channel and connection concurrently and the channel close never resolves.
@Injectable()
export class RabbitMqHealthService {
  constructor(
    private readonly health: HealthIndicatorService,
    private readonly config: ConfigService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.health.check(key);
    const url =
      `amqp://${this.config.get('RABBITMQ_USER')}:${this.config.get('RABBITMQ_PASSWORD')}` +
      `@${this.config.get('RABBITMQ_HOST')}:${this.config.get('RABBITMQ_PORT')}`;
    try {
      const conn = await connect(url, { timeout: 1500 });
      await conn.close();
      return indicator.up();
    } catch (e) {
      return indicator.down({ message: (e as Error).message });
    }
  }
}
