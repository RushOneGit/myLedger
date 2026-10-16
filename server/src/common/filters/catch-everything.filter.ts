import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CustomLoggerService } from '../logger/custom-logger.service';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;

    // In certain situations `httpAdapter` might not be available in the
    // constructor, so resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof body === 'string'
        ? body
        : ((body as any)?.message ?? HttpStatus.INTERNAL_SERVER_ERROR);
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const stack = exception instanceof Error ? exception.stack : String(exception);

    if (status >= 500) {
      this.logger.error(message, stack, { path: httpAdapter.getRequestUrl(ctx.getRequest()) });
    }

    const responseBody = {
      status: status,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
