import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomLogger } from './common/services/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { join } from 'path';

async function bootstrap() {
  // Winston logger configuration với daily rotate
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ms }) => {
            return `[${timestamp}] ${level}: ${message} ${ms}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.prettyPrint()
        ),
        maxFiles: 14, // Giữ log 14 ngày
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.prettyPrint()
        ),
        maxFiles: 7,
      }),
    ],
  });
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }
  });

  // Security middlewares với cấu hình chi tiết
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'https:'],
        scriptSrc: [`'self'`],
      },
    }
  }));

  // Compression với cấu hình tối ưu
  app.use(compression({
    level: 6, // level từ 1-9, càng cao càng nén nhiều nhưng tốn CPU
    threshold: 100 * 1024, // Chỉ nén các response > 100kb
  }));

  app.use(cookieParser());

  // Cấu hình serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
    maxAge: '1d', // Browser cache 1 ngày
    index: false, // Không serve index file
  });

  // Global pipes với validation chi tiết
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Ẩn error messages trong production
      validateCustomDecorators: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Custom logger setup
  const customLogger = await app.resolve(CustomLogger);
  app.useLogger(customLogger);
  app.useGlobalFilters(new HttpExceptionFilter(customLogger));
  app.useGlobalInterceptors(new LoggingInterceptor(customLogger));

  // Swagger documentation với thông tin chi tiết
  const config = new DocumentBuilder()
    .setTitle('Wedding Management API')
    .setDescription('API Documentation for Wedding Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Costumes', 'Costume management endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addServer(process.env.API_URL || 'http://localhost:3001', 'Local Development')
    .setContact('Support Team', 'https://yourwebsite.com', 'support@yourwebsite.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Khởi động server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Logging startup information
  Logger.log(`🚀 Environment: ${process.env.NODE_ENV}`);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  Logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  Logger.log(`🔐 API Version: 1.0.0`);
}

bootstrap().catch(err => {
  Logger.error(`❌ Error starting server:`, err);
  process.exit(1);
});
