import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import {
  ReadPreference,
  WriteConcern,
  ReadConcern,
  ReadPreferenceMode,
  ReadConcernLevel,
  W,
} from 'mongodb';
import { DatabaseConfig } from '../interfaces/database.interface';

interface MongoQuery {
  explain: () => unknown;
}

interface MongoCollection {
  prototype: {
    find: (...args: unknown[]) => MongoQuery;
  };
}

interface MongooseOptionsWithMaxTime extends MongooseModuleOptions {
  maxTimeMS?: number;
}

interface WriteConcernOptions {
  j?: boolean;
  wtimeout?: number;
}

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  private readonly config: DatabaseConfig;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<DatabaseConfig>('database');
    if (!config) {
      throw new Error('Database configuration not found');
    }
    this.config = config;
  }

  createMongooseOptions(): MongooseModuleOptions {
    const options = this.getMongooseOptions();
    console.log(
      '🚀 ~ MongooseConfigService ~ createMongooseOptions ~ connection:',
      options,
    );
    return {
      ...options,
      connectionFactory: (connection: Connection) => {
        console.log(
          '🚀 ~ MongooseConfigService ~ createMongooseOptions ~ connection:',
          connection,
        );
        connection.on('connected', () => {
          console.log('MongoDB is connected');
          this.logConnectionInfo(connection);
        });

        connection.on('disconnected', () => {
          console.log('MongoDB is disconnected');
        });

        connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
        });

        if (this.config.logging?.explain) {
          this.enableQueryExplaining(connection);
        }

        return connection;
      },
    };
  }

  private getMongooseOptions(): MongooseOptionsWithMaxTime {
    const { primary } = this.config;
    if (!primary) {
      throw new Error('Primary database configuration not found');
    }

    const commonOptions: MongooseOptionsWithMaxTime = {
      uri: primary.uri,
      serverSelectionTimeoutMS: primary.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: primary.socketTimeoutMS || 45000,
      maxPoolSize: primary.maxPoolSize || 10,
      minPoolSize: primary.minPoolSize || 1,
      autoIndex: primary.autoIndex ?? process.env.NODE_ENV !== 'production',
      retryWrites: primary.retryWrites ?? true,
      retryReads: primary.retryReads ?? true,
    };

    // Add write concern with type override for MongoDB driver compatibility
    if (primary.writeConcern) {
      const w = (primary.writeConcern.w || 'majority') as W;
      const writeConcernOptions: WriteConcernOptions = {
        j: primary.writeConcern.j ?? true,
        wtimeout: primary.writeConcern.wtimeout || 10000,
      };

      const writeConcern = new WriteConcern(w);
      Object.assign(writeConcern, writeConcernOptions);
      commonOptions.writeConcern = writeConcern;
    }

    // Add read preference
    const readPrefMode = (primary.readPreference ||
      'primary') as ReadPreferenceMode;

    commonOptions.readPreference = new ReadPreference(readPrefMode);

    // Add read concern
    const readConcernLevel = (primary.readConcern?.level ||
      'majority') as ReadConcernLevel;

    commonOptions.readConcern = new ReadConcern(readConcernLevel);

    if (this.config.logging?.slowMs) {
      commonOptions.maxTimeMS = this.config.logging.slowMs;
    }

    return commonOptions;
  }

  private logConnectionInfo(connection: Connection): void {
    const state = ConnectionStates[connection.readyState];
    const { host, port, name } = connection;
    console.log(`MongoDB Connection Info:
      - State: ${state}
      - Host: ${host}
      - Port: ${port}
      - Database: ${name}
      - Max Pool Size: ${this.config.primary?.maxPoolSize || 10}
      - Min Pool Size: ${this.config.primary?.minPoolSize || 1}
      - Auto Index: ${this.config.primary?.autoIndex ?? true}
    `);
  }

  private enableQueryExplaining(connection: Connection): void {
    // Safe type assertion since we know the internal structure
    const Collection = connection.collection('')
      .constructor as unknown as MongoCollection;

    if (!Collection?.prototype?.find) {
      return;
    }

    const execCollectionMethod = Collection.prototype.find;

    Collection.prototype.find = function (...args: unknown[]): MongoQuery {
      const result = execCollectionMethod.apply(this, args) as MongoQuery;
      return result;
    };
  }
}
