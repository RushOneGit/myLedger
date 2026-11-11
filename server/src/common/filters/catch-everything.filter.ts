import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { InvalidMoneyError, UnknownCurrencyError } from '../money';

interface ResolvedException {
  status: number;
  message: unknown;
  stack: string | undefined;
}

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
    const path = httpAdapter.getRequestUrl(ctx.getRequest()) as string;

    const { status, message, stack } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(message, stack, { path });
    }

    const responseBody = {
      status,
      timestamp: new Date().toISOString(),
      path,
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }

  private resolve(exception: unknown): ResolvedException {
    const stack = exception instanceof Error ? exception.stack : String(exception);

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return {
        status: exception.getStatus(),
        message:
          typeof body === 'string'
            ? body
            : ((body as { message?: unknown }).message ?? exception.message),
        stack,
      };
    }
    if (exception instanceof InvalidMoneyError || exception instanceof UnknownCurrencyError) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message, stack };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error', stack };
  }
}
