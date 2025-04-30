export interface DatabaseConfig {
  uri: string;
  name: string;
  primary: {
    uri: string;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    maxPoolSize?: number;
    minPoolSize?: number;
    keepAlive?: boolean;
    keepAliveInitialDelay?: number;
    autoIndex?: boolean;
    retryWrites?: boolean;
    retryReads?: boolean;
    writeConcern?: {
      w?: string | number;
      j?: boolean;
      wtimeout?: number;
    };
    readPreference?: string;
    readConcern?: { level?: string };
  };
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    [key: string]: any;
  };
  backup?: {
    enabled: boolean;
    directory: string;
    retention: number;
    schedule: string;
  };
  migrations?: {
    enabled: boolean;
    directory: string;
  };
  logging?: {
    explain?: boolean;
    slowMs?: number;
  };
}

// Re-export the MongooseModuleOptions from @nestjs/mongoose to avoid conflicts
export type { MongooseModuleOptions } from '@nestjs/mongoose';
