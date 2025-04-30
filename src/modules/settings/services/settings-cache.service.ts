import { Injectable } from '@nestjs/common';
import { Settings } from '../schemas/settings.schema';
import { CustomLogger } from '../../../common/services/logger.service';

@Injectable()
export class SettingsCacheService {
  private cache: Settings | null = null;

  constructor(private readonly logger: CustomLogger) { }

  get(): Settings | null {
    return this.cache;
  }
  // interface Settings || any
  set(settings: any): void {
    this.cache = settings;
    this.logger.log('Settings cached', 'SettingsCacheService');
  }

  invalidate(): void {
    this.cache = null;
    this.logger.log('Settings cache invalidated', 'SettingsCacheService');
  }
}
