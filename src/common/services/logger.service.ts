import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface LogContext {
  context?: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;
  private requestId?: string;

  constructor() {
    const logDir = join(process.cwd(), 'logs');

    const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const logData = {
        timestamp,
        level,
        message,
        ...meta,
      };
      return JSON.stringify(logData);
    });

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
        logFormat,
      ),
      defaultMeta: { service: 'wedding-management' },
      transports: [
        new DailyRotateFile({
          filename: join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
        }),
        new DailyRotateFile({
          filename: join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
      exitOnError: false,
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    }
  }

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  setRequestId(requestId?: string): this {
    this.requestId = requestId || uuidv4();
    return this;
  }

  private buildContext(additionalContext?: LogContext): LogContext {
    return {
      context: this.context,
      requestId: this.requestId,
      ...additionalContext,
    };
  }

  log(message: string, context?: string | LogContext) {
    const logContext = this.buildContext(typeof context === 'string' ? { context } : context);
    this.logger.info(message, logContext);
  }

  error(message: string | Error, trace?: string | LogContext, context?: string) {
    const error = message instanceof Error ? message : new Error(message.toString());
    const stackTrace = trace && typeof trace === 'string' ? trace : error.stack;

    const logContext = this.buildContext(
      typeof trace === 'object'
        ? { ...trace, context: context || trace.context }
        : { context, trace: stackTrace }
    );

    this.logger.error(error.message, {
      ...logContext,
      stack: stackTrace,
    });
  }

  warn(message: string, context?: string | LogContext) {
    const logContext = this.buildContext(typeof context === 'string' ? { context } : context);
    this.logger.warn(message, logContext);
  }

  debug(message: string, context?: string | LogContext) {
    const logContext = this.buildContext(typeof context === 'string' ? { context } : context);
    this.logger.debug(message, logContext);
  }

  verbose(message: string, context?: string | LogContext) {
    const logContext = this.buildContext(typeof context === 'string' ? { context } : context);
    this.logger.verbose(message, logContext);
  }
}
