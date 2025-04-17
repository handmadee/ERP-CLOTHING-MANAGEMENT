import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseResponse } from '../interfaces/base-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse: BaseResponse<null> = {
      success: false,
      message,
      error: {
        statusCode: status,
        error: exception.name,
        details: exception instanceof HttpException ? exception.getResponse() : undefined,
      },
      metadata: {
        timestamp: new Date(),
        path: request.url,
      },
    };

    // Log the error for debugging
    console.error('Exception:', {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: exception,
    });

    response.status(status).json(errorResponse);
  }
} 