export enum Currency {
  VND = 'VND',
  USD = 'USD',
}

export enum Language {
  VI = 'vi',
  EN = 'en',
}

export const DEFAULT_SETTINGS = {
  companyName: 'Wedding Management',
  email: 'contact@weddingmanagement.com',
  phone: '+84 123 456 789',
  address: '123 Wedding Street, City, Country',
  currency: Currency.VND,
  language: Language.VI,
  registrationSecret: 'default-secret-change-me',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  twoFactorEnabled: false,
} as const;

export const SETTINGS_ERROR_MESSAGES = {
  NOT_FOUND: 'Settings not found',
  INVALID_CURRENCY: 'Invalid currency code',
  INVALID_LANGUAGE: 'Invalid language code',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number format',
} as const;

export const SETTINGS_CACHE_KEY = 'settings';
export const SETTINGS_CACHE_TTL = 3600; // 1 hour
