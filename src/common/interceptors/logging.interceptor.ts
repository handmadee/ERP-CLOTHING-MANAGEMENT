import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: CustomLogger) {
        this.logger.setContext('API');
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, headers, ip } = request;
        const userAgent = headers['user-agent'] || 'unknown';

        // Generate or use existing request ID
        const requestId = headers['x-request-id'] || uuidv4();
        request.headers['x-request-id'] = requestId;

        this.logger.setRequestId(requestId);

        // Create redacted body by removing sensitive fields
        const sanitizedBody = this.sanitizeBody(body);

        const now = Date.now();
        const contextData = {
            requestId,
            method,
            url,
            userAgent,
            ip,
        };

        this.logger.log(`Request: ${method} ${url}`, {
            ...contextData,
            body: sanitizedBody,
        });

        return next.handle().pipe(
            tap({
                next: (data: any) => {
                    const responseTime = Date.now() - now;
                    let responseData = data;

                    // Don't log large responses in full
                    if (data && typeof data === 'object') {
                        // Check if response is too large (over 1KB)
                        const dataSize = JSON.stringify(data).length;
                        if (dataSize > 1024) {
                            responseData = {
                                _summary: `Response data too large (${dataSize} bytes)`,
                                _type: Array.isArray(data) ? 'array' : 'object',
                                _size: dataSize
                            };
                        }
                    }

                    this.logger.log(`Response: ${method} ${url} ${responseTime}ms`, {
                        ...contextData,
                        responseTime,
                        responseData,
                    });
                },
                error: (error: any) => {
                    const responseTime = Date.now() - now;
                    this.logger.error(`Error: ${method} ${url} ${responseTime}ms`, {
                        error,
                        ...contextData,
                        responseTime,
                    });
                }
            }),
        );
    }

    private sanitizeBody(body: any): any {
        if (!body) return {};

        // Create a deep copy to avoid modifying the original
        const sanitized = JSON.parse(JSON.stringify(body));

        // List of sensitive fields to redact
        const sensitiveFields = ['password', 'secret', 'token', 'refreshToken', 'creditCard', 'ssn'];

        this.redactSensitiveData(sanitized, sensitiveFields);

        return sanitized;
    }

    private redactSensitiveData(obj: any, sensitiveFields: string[]): void {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(obj).forEach(key => {
            if (sensitiveFields.includes(key.toLowerCase())) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                this.redactSensitiveData(obj[key], sensitiveFields);
            }
        });
    }
} 