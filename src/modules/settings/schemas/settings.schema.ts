import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SettingsDocument = Settings & Document;

@Schema({
  timestamps: true,
  collection: 'settings'
})
export class Settings {
  @ApiProperty({ description: 'Company name' })
  @Prop({ required: true })
  companyName: string;

  @ApiProperty({ description: 'Company email' })
  @Prop({ required: true })
  email: string;

  @ApiProperty({ description: 'Company phone number' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: 'Company address' })
  @Prop({ required: true })
  address: string;

  @ApiProperty({ description: 'Currency code', enum: ['VND', 'USD'] })
  @Prop({ default: 'VND' })
  currency: string;

  @ApiProperty({ description: 'Language code', enum: ['vi', 'en'] })
  @Prop({ default: 'vi' })
  language: string;

  @ApiProperty({ description: 'Company logo URL', required: false })
  @Prop()
  logo?: string;

  @ApiProperty({ description: 'Registration secret code' })
  @Prop({ required: true })
  registrationSecret: string;

  @ApiProperty({ description: 'Notification settings' })
  @Prop({
    type: Object,
    default: {
      email: true,
      push: true,
      sms: false
    }
  })
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  @ApiProperty({ description: 'Two-factor authentication enabled' })
  @Prop({ default: false })
  twoFactorEnabled: boolean;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
