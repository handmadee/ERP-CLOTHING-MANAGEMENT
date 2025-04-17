import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { loadConfig } from './config/configuration.loader';
import { Config } from './config/interfaces/config.interface';
import { MongooseConfigService } from './config/database/mongoose.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig()],
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongooseConfigService,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService<Config>,
      ): Promise<ThrottlerModuleOptions> => {
        const ttl = configService.get('throttle.ttl', { infer: true });
        const limit = configService.get('throttle.limit', { infer: true });
        
        return {
          throttlers: [
            {
              ttl: ttl ?? 60,
              limit: limit ?? 100,
            },
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    MongooseConfigService,
  ],
  exports: [MongooseConfigService],
})
export class AppModule {}
