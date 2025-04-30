export interface INotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface ISecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange?: Date;
}

export interface ISettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  language: string;
  logoUrl?: string;
  notifications: INotificationSettings;
  security: ISecuritySettings;
  version: number;
}

export type ISettingsUpdate = Partial<ISettings>;
