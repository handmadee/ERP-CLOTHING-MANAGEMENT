import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLogger } from '../services/logger.service';
import { ApiResponse } from '../dto/api-response.dto';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLogger) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    // Set request ID for logging
    this.logger.setRequestId(requestId);

    let statusCode: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || 'HTTP Exception';
      } else {
        message = exception.message;
        error = 'HTTP Exception';
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : exception.message;
      error = exception.name || 'Internal Server Error';

      // Log internal server errors with stack trace
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'UnhandledException'
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Unknown Error';

      this.logger.error(
        `Unknown exception type: ${exception}`,
        {
          path: request.url,
          method: request.method,
        }
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId: requestId,
    };

    // Don't log 404 errors as errors - they're just warnings
    if (statusCode === HttpStatus.NOT_FOUND) {
      this.logger.warn(`Resource not found: ${request.method} ${request.url}`);
    }
    // Don't log validation errors as errors - they're just warnings
    else if (statusCode === HttpStatus.BAD_REQUEST) {
      this.logger.warn(`Bad request: ${request.method} ${request.url}`, {
        error: message,
      });
    }
    // Log unhandled client errors (4xx)
    else if (statusCode >= 400 && statusCode < 500) {
      this.logger.warn(`Client error: ${request.method} ${request.url}`, {
        statusCode,
        error: message,
      });
    }

    response.status(statusCode).json(errorResponse);
  }
}
