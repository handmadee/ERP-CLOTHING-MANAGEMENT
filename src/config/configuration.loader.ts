import { Config } from './interfaces/config.interface';
import developmentConfig from './env/development.config';
import productionConfig from './env/production.config';
import * as dotenv from 'dotenv';
dotenv.config();
export function loadConfig(): () => Config {
  const environment = process.env.NODE_ENV || 'development';
  switch (environment) {
    case 'production':
      return productionConfig as () => Config;
    case 'development':
    default:
      return developmentConfig as () => Config;
  }
} 