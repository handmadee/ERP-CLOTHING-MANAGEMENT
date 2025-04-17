import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponse } from '../interfaces/base-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, BaseResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // If the response is already in BaseResponse format, return it as is
        if (data?.success !== undefined) {
          return data;
        }

        // Otherwise, transform it to BaseResponse format
        return {
          success: true,
          message: 'Success',
          data,
          metadata: {
            timestamp: new Date(),
            path: request.url,
          },
        };
      }),
    );
  }
}
