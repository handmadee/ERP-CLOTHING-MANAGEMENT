import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import {
  UpdateSettingsDto,
  UpdateNotificationsDto,
  UpdateSecurityDto,
} from './dto/settings.dto';
import { CustomLogger } from '../../common/services/logger.service';
import { SettingsCacheService } from './services/settings-cache.service';
import { DEFAULT_SETTINGS, SETTINGS_ERROR_MESSAGES } from './constants/settings.constant';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<SettingsDocument>,
    private readonly settingsCacheService: SettingsCacheService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('SettingsService');
  }

  async onModuleInit() {
    // Initialize settings on module init to ensure they exist
    await this.initializeSettings();
  }

  async getSettings(): Promise<Settings> {
    try {
      const cachedSettings = this.settingsCacheService.get();
      if (cachedSettings) {
        return cachedSettings;
      }

      this.logger.log('Cache miss, fetching settings from DB');
      const settings = await this.settingsModel.findOne().exec();

      if (!settings) {
        return this.initializeSettings();
      }

      this.settingsCacheService.set(settings);
      return settings;
    } catch (error) {
      this.logger.error('Error fetching settings', error);
      throw new InternalServerErrorException('Failed to fetch settings');
    }
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<Settings> {
    try {
      const settings = await this.settingsModel.findOne().exec();
      if (!settings) {
        this.logger.error(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
        throw new NotFoundException(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
      }

      Object.assign(settings, updateSettingsDto);
      const updatedSettings = await settings.save();

      this.settingsCacheService.invalidate();
      this.logger.log('Settings updated successfully');

      return updatedSettings;
    } catch (error) {
      this.handleError(error, 'updating settings');
    }
  }

  async updateNotifications(updateNotificationsDto: UpdateNotificationsDto): Promise<Settings> {
    try {
      const settings = await this.settingsModel.findOne().exec();
      if (!settings) {
        this.logger.error(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
        throw new NotFoundException(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
      }

      settings.notifications = updateNotificationsDto.notifications;
      const updatedSettings = await settings.save();

      this.settingsCacheService.invalidate();
      this.logger.log('Notification settings updated');

      return updatedSettings;
    } catch (error) {
      this.handleError(error, 'updating notification settings');
    }
  }

  async updateSecurity(updateSecurityDto: UpdateSecurityDto): Promise<Settings> {
    try {
      const settings = await this.settingsModel.findOne().exec();
      if (!settings) {
        this.logger.error(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
        throw new NotFoundException(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
      }

      if (updateSecurityDto.twoFactorEnabled !== undefined) {
        settings.twoFactorEnabled = updateSecurityDto.twoFactorEnabled;
      }

      const updatedSettings = await settings.save();
      this.settingsCacheService.invalidate();
      this.logger.log('Security settings updated');

      return updatedSettings;
    } catch (error) {
      this.handleError(error, 'updating security settings');
    }
  }

  async getRegistrationSecret(): Promise<string | undefined> {
    try {
      const settings = await this.getSettings();
      return settings?.registrationSecret;
    } catch (error) {
      this.logger.error('Error fetching registration secret', error);
      throw new InternalServerErrorException('Failed to fetch registration secret');
    }
  }

  async updateRegistrationSecret(secret: string): Promise<Settings> {
    try {
      const settings = await this.settingsModel.findOne().exec();
      if (!settings) {
        throw new NotFoundException(SETTINGS_ERROR_MESSAGES.NOT_FOUND);
      }

      settings.registrationSecret = secret;
      const updatedSettings = await settings.save();
      this.settingsCacheService.invalidate();
      this.logger.log('Registration secret updated');

      return updatedSettings;
    } catch (error) {
      this.handleError(error, 'updating registration secret');
    }
  }

  private async initializeSettings(): Promise<Settings> {
    try {
      const existingSettings = await this.settingsModel.findOne().exec();
      if (existingSettings) {
        this.settingsCacheService.set(existingSettings);
        return existingSettings;
      }

      this.logger.log('Initializing default settings');
      const defaultSettings = new this.settingsModel({
        ...DEFAULT_SETTINGS,
        registrationSecret: DEFAULT_SETTINGS.registrationSecret || this.generateRandomSecret(),
      });

      const savedSettings = await defaultSettings.save();
      this.settingsCacheService.set(savedSettings);

      return savedSettings;
    } catch (error) {
      this.logger.error('Error initializing settings', error);
      throw new InternalServerErrorException('Failed to initialize settings');
    }
  }

  private generateRandomSecret(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private handleError(error: any, operation: string): never {
    this.logger.error(`Error ${operation}`, error);

    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException(`Failed while ${operation}`);
  }
}
