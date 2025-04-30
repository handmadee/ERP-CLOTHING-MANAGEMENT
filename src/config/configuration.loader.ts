import { plainToInstance } from 'class-transformer';
import { validateSync, IsString, IsNumber, IsOptional, IsIn, IsUrl, IsBoolean } from 'class-validator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

class EnvironmentVariables {
  @IsNumber()
  @IsOptional()
  PORT: number;

  @IsString()
  @IsOptional()
  NODE_ENV: string;

  @IsUrl({ require_tld: false })
  MONGODB_URI: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string;

  @IsNumber()
  @IsOptional()
  THROTTLE_TTL: number;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number;

  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED: boolean;
}

export function loadConfig() {
  return () => {
    // Load .env file if it exists
    const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
    const envPath = path.resolve(process.cwd(), envFile);

    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const key in envConfig) {
        process.env[key] = process.env[key] || envConfig[key];
      }
    }

    validateEnvironmentVariables();

    return {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-management',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'default-jwt-secret-do-not-use-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-do-not-use-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
      throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
      },
      swagger: {
        enabled: process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production',
      },
    };
  };
}

function validateEnvironmentVariables() {
  const envVars = plainToInstance(EnvironmentVariables, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(envVars, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Environment validation failed, errors:');
      const errorMessages = errors.map(error => {
        if (error.constraints) {
          return Object.values(error.constraints).join(', ');
        }
        return `Error validating ${error.property}`;
      }).join('\n');
      console.error(errorMessages);
      throw new Error('Environment validation failed');
    } else {
      console.warn('Environment validation warnings:');
      const errorMessages = errors.map(error => {
        if (error.constraints) {
          return Object.values(error.constraints).join(', ');
        }
        return `Warning validating ${error.property}`;
      }).join('\n');
      console.warn(errorMessages);
    }
  }
}
