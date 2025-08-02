import type { Config } from 'drizzle-kit';
import {
  isPostgresConfig,
  isSqliteConfig,
  extractPostgresCredentials,
  extractSqliteCredentials,
} from './utils';

export interface ResetResult {
  success: boolean;
  tablesDropped: string[];
  error?: string;
}

/**
 * Resets the database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetDatabase(config: Config): Promise<ResetResult> {
  try {
    console.log(`Resetting ${config.dialect} database...`);
    
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, resetPostgresDatabase } = await import('./postgres');
      const connection = await preparePostgresDB(credentials);
      return await resetPostgresDatabase(connection);
    }
    
    if (isSqliteConfig(config)) {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, resetSqliteDatabase } = await import('./sqlite');
      const connection = await prepareSQLiteDB(credentials);
      return await resetSqliteDatabase(connection);
    }
    
    // Handle unsupported dialects
    if (config.dialect === 'mysql' || config.dialect === 'singlestore' || config.dialect === 'gel') {
      throw new Error(
        `Dialect ${config.dialect} is not yet supported. Only PostgreSQL and SQLite are currently supported.`
      );
    }
    
    throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
  } catch (error) {
    console.error('Database reset failed:', error);
    return {
      success: false,
      tablesDropped: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}