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
import { Currency, Language } from '../constants/settings.constant';

export class NotificationsDto {
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @IsBoolean()
  @IsOptional()
  sms?: boolean;
}

export class SecurityDto {
  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;
}

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  registrationSecret?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => NotificationsDto)
  @IsOptional()
  notifications?: NotificationsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SecurityDto)
  @IsOptional()
  security?: SecurityDto;

  @IsObject()
  @IsOptional()
  additionalSettings?: Record<string, any>;
}
