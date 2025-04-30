import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  VND = 'VND',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  VI = 'vi',
}

@Schema({ _id: false })
export class Notifications {
  @Prop({ type: Boolean, default: true })
  email!: boolean;

  @Prop({ type: Boolean, default: true })
  push!: boolean;

  @Prop({ type: Boolean, default: true })
  sms!: boolean;
}

@Schema({ _id: false })
export class Security {
  @Prop({ type: Boolean, default: false })
  twoFactorAuth!: boolean;

  @Prop({ type: Date })
  lastPasswordChange?: Date;
}

@Schema({
  timestamps: true,
  collection: 'settings',
  versionKey: false,
})
export class Settings extends Document {
  @Prop({ type: String, required: false })
  registrationSecret?: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
    default: () => new Notifications(),
  })
  notifications!: Notifications;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
    default: () => new Security(),
  })
  security!: Security;

  @Prop({ type: String, required: false })
  companyName?: string;

  @Prop({ type: String, required: false })
  companyEmail?: string;

  @Prop({ type: String, required: false })
  companyPhone?: string;

  @Prop({ type: String, required: false })
  companyAddress?: string;

  @Prop({
    type: String,
    enum: Currency,
    default: Currency.USD,
    required: true,
  })
  currency!: Currency;

  @Prop({
    type: String,
    enum: Language,
    default: Language.EN,
    required: true,
  })
  language!: Language;

  @Prop({ type: String, required: false })
  logoUrl?: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
    default: {},
  })
  additionalSettings?: Record<string, unknown>;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });
