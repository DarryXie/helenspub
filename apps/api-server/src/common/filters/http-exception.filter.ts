import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

function toBusinessCode(status: number) {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 4001;
    case HttpStatus.UNAUTHORIZED:
      return 4003;
    case HttpStatus.FORBIDDEN:
      return 4004;
    case HttpStatus.NOT_FOUND:
      return 4040;
    case HttpStatus.CONFLICT:
      return 4090;
    default:
      return 5000;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === 'string'
          ? raw
          : Array.isArray((raw as { message?: string | string[] }).message)
            ? (raw as { message: string[] }).message.join(', ')
            : ((raw as { message?: string }).message ?? exception.message);

      response.status(status).json({
        code: toBusinessCode(status),
        message,
        data: null,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 5000,
      message: 'Internal server error',
      data: null,
    });
  }
}
