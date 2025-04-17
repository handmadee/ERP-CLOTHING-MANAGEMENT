import { Request } from 'express';
import { BaseResponse } from '../interfaces/base-response.interface';

export class BaseController {
  protected success<T>(
    data: T,
    message = 'Success',
    req?: Request,
  ): BaseResponse<T> {
    return {
      success: true,
      message,
      data,
      metadata: req
        ? {
            timestamp: new Date(),
            path: req.url,
          }
        : undefined,
    };
  }

  protected error(
    message: string,
    error?: any,
    req?: Request,
  ): BaseResponse<null> {
    return {
      success: false,
      message,
      error,
      metadata: req
        ? {
            timestamp: new Date(),
            path: req.url,
          }
        : undefined,
    };
  }
}
