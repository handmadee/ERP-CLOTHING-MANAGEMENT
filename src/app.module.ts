import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { loadConfig } from './config/configuration.loader';
import { Config } from './config/interfaces/config.interface';
import { MongooseConfigService } from './config/database/mongoose.config';
import { ImagesModule } from './modules/images/images.module';
import { AuthModule } from './modules/auth/auth.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CostumesModule } from './modules/costumes/costumes.module';
import { LoggerModule } from './common/modules/logger.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    LoggerModule,
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig()],
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: process.env.MONGODB_URI,
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Config>,
      ): ThrottlerModuleOptions => {
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
    }),

    AuthModule,

    ImagesModule,

    SettingsModule,

    CategoriesModule,

    CostumesModule,
    CustomersModule,

    OrdersModule,

    DashboardModule
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
export class AppModule { }
