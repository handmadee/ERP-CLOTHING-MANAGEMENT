import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DatabaseConfig } from '../interfaces/database.interface';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private readonly migrationConfig: Required<DatabaseConfig['migrations']>;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<DatabaseConfig>('database');
    if (!config?.migrations?.enabled) {
      return;
    }
    this.migrationConfig = config.migrations as Required<
      DatabaseConfig['migrations']
    >;
  }

  async onModuleInit(): Promise<void> {
    if (this.migrationConfig?.enabled) {
      await this.runMigrations();
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      const migrationsCollection = this.connection.collection('migrations');

      // Get all applied migrations
      const appliedMigrations = await migrationsCollection
        .find({})
        .sort({ timestamp: -1 })
        .toArray();

      const appliedMigrationNames = new Set(
        appliedMigrations.map((m) => m.name),
      );

      // Get all migration files from the migrations directory
      const migrations = await this.loadMigrationFiles();

      // Run pending migrations
      for (const migration of migrations) {
        if (!appliedMigrationNames.has(migration.name)) {
          this.logger.log(`Running migration: ${migration.name}`);

          const session = await this.connection.startSession();

          try {
            session.startTransaction();

            await migration.up(this.connection, session);

            await migrationsCollection.insertOne(
              {
                name: migration.name,
                timestamp: new Date(),
              },
              { session },
            );

            await session.commitTransaction();
            this.logger.log(`Migration completed: ${migration.name}`);
          } catch (error) {
            await session.abortTransaction();
            this.logger.error(`Migration failed: ${migration.name}`, error);
            throw error;
          } finally {
            await session.endSession();
          }
        }
      }
    } catch (error) {
      this.logger.error('Migration process failed:', error);
      throw error;
    }
  }

  private async loadMigrationFiles(): Promise<
    Array<{
      name: string;
      up: (connection: Connection, session?: any) => Promise<void>;
    }>
  > {
    // This is a placeholder. In a real application, you would:
    // 1. Scan the migrations directory
    // 2. Load and validate each migration file
    // 3. Sort migrations by timestamp/sequence
    // For now, we return an empty array
    return [];
  }

  async revertLastMigration(): Promise<void> {
    try {
      const migrationsCollection = this.connection.collection('migrations');

      // Get the last applied migration
      const lastMigration = await migrationsCollection
        .find({})
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      if (lastMigration.length === 0) {
        this.logger.log('No migrations to revert');
        return;
      }

      const session = await this.connection.startSession();

      try {
        session.startTransaction();

        // Load and execute the down function of the last migration
        // This is a placeholder. In a real application, you would:
        // 1. Load the migration file
        // 2. Execute its down function

        await migrationsCollection.deleteOne(
          { name: lastMigration[0].name },
          { session },
        );

        await session.commitTransaction();
        this.logger.log(`Reverted migration: ${lastMigration[0].name}`);
      } catch (error) {
        await session.abortTransaction();
        this.logger.error('Migration reversion failed:', error);
        throw error;
      } finally {
        await session.endSession();
      }
    } catch (error) {
      this.logger.error('Migration reversion process failed:', error);
      throw error;
    }
  }
}
