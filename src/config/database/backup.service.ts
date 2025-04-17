import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConfig } from '../interfaces/database.interface';

const execAsync = promisify(exec);
const BACKUP_SCHEDULE = '0 0 * * *'; 

interface BackupConfig {
  enabled: boolean;
  directory: string;
  retention: number;
  schedule: string;
}

@Injectable()
export class MongoBackupService {
  private readonly logger = new Logger(MongoBackupService.name);
  private readonly backupConfig: BackupConfig;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<DatabaseConfig>('database');
    if (!config?.backup?.enabled) {
      throw new Error('Backup configuration is not enabled or missing');
    }

    const { directory, retention, schedule } = config.backup;
    if (!directory || !retention) {
      throw new Error(
        'Invalid backup configuration: missing required properties',
      );
    }

    this.backupConfig = {
      enabled: true,
      directory,
      retention,
      schedule: schedule || BACKUP_SCHEDULE,
    };
  }

  @Cron(BACKUP_SCHEDULE)
  async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(
        this.backupConfig.directory,
        `backup-${timestamp}`,
      );

      // Ensure backup directory exists
      await fs.promises.mkdir(this.backupConfig.directory, { recursive: true });

      const config = this.configService.get<DatabaseConfig>('database');
      if (!config?.primary?.uri) {
        throw new Error('Database URI not configured');
      }

      // Create backup
      await execAsync(
        `mongodump --uri="${config.primary.uri}" --out="${backupPath}"`,
      );

      this.logger.log(`Backup created successfully at ${backupPath}`);

      // Clean up old backups
      await this.cleanOldBackups();
    } catch (error) {
      this.logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.backupConfig.directory);
      const now = new Date();

      for (const file of files) {
        const filePath = path.join(this.backupConfig.directory, file);
        const stats = await fs.promises.stat(filePath);
        const daysOld =
          (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (daysOld > this.backupConfig.retention) {
          await fs.promises.rm(filePath, { recursive: true });
          this.logger.log(`Deleted old backup: ${filePath}`);
        }
      }
    } catch (error) {
      this.logger.error('Cleanup of old backups failed:', error);
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    try {
      const config = this.configService.get<DatabaseConfig>('database');
      if (!config?.primary?.uri) {
        throw new Error('Database URI not configured');
      }

      // Restore backup
      await execAsync(
        `mongorestore --uri="${config.primary.uri}" "${backupPath}"`,
      );

      this.logger.log(`Backup restored successfully from ${backupPath}`);
    } catch (error) {
      this.logger.error('Backup restoration failed:', error);
      throw error;
    }
  }
}
