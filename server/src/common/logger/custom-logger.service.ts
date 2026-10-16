import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentEnum } from '../enums';

@Injectable()
export class CustomLoggerService extends ConsoleLogger {
  constructor(configService: ConfigService) {
    const isProd = configService.get<string>('NODE_ENV') === EnvironmentEnum.Prod;

    super({
      colors: !isProd,
      json: isProd, // JSON in prod, coloured pretty output in dev
      logLevels: isProd
        ? ['fatal', 'error', 'warn', 'log']
        : ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'],
    });
  }
}
