import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Currency, Language } from '../constants/settings.constant';

export class NotificationSettingsDto {
  @ApiProperty({
    description: 'Enable/disable email notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  email: boolean;

  @ApiProperty({
    description: 'Enable/disable push notifications',
    example: true,
    default: true,
  })
  @IsBoolean()
  push: boolean;

  @ApiProperty({
    description: 'Enable/disable SMS notifications',
    example: false,
    default: false,
  })
  @IsBoolean()
  sms: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Wedding Management',
  })
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Company email',
    example: 'contact@weddingmanagement.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Company phone',
    example: '+84 123 456 789',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Company address',
    example: '123 Wedding Street, City, Country',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Currency',
    enum: Currency,
    example: Currency.VND,
  })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({
    description: 'Language',
    enum: Language,
    example: Language.VI,
  })
  @IsEnum(Language)
  language: Language;

  @ApiProperty({
    description: 'Company logo URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'Registration secret code',
  })
  @IsString()
  registrationSecret: string;

  @ApiProperty({
    description: 'Notification settings',
    type: NotificationSettingsDto,
  })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;

  @ApiProperty({
    description: 'Two-factor authentication enabled',
    default: false,
  })
  @IsBoolean()
  twoFactorEnabled: boolean;
}

export class UpdateNotificationsDto {
  @ApiProperty({
    description: 'Notification settings',
    type: NotificationSettingsDto,
  })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;
}

export class UpdateSecurityDto {
  @ApiProperty({
    description: 'Current password',
    required: false,
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    description: 'New password',
    required: false,
  })
  @IsOptional()
  @IsString()
  newPassword?: string;

  @ApiProperty({
    description: 'Enable/disable two-factor authentication',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}
