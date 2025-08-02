import type { Config } from 'drizzle-kit';
import type { TruncateResult } from '@makeco/db-cli/types';
import {
  isPostgresConfig,
  isSqliteConfig,
  extractPostgresCredentials,
  extractSqliteCredentials,
} from '@makeco/db-cli/utils';

/**
 * Truncates the database by deleting all data from user tables while preserving 
 * table structure and system tables
 */
export async function truncateDatabase(config: Config): Promise<TruncateResult> {
  try {
    console.log(`Truncating ${config.dialect} database...`);
    
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, truncatePostgresDatabase } = await import('@makeco/db-cli/postgres');
      const connection = await preparePostgresDB(credentials);
      return await truncatePostgresDatabase(connection);
    }
    
    if (isSqliteConfig(config)) {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, truncateSQLiteDatabase } = await import('@makeco/db-cli/sqlite');
      const connection = await prepareSQLiteDB(credentials);
      return await truncateSQLiteDatabase(connection);
    }
    
    // Handle unsupported dialects
    if (config.dialect === 'mysql' || config.dialect === 'singlestore' || config.dialect === 'gel') {
      throw new Error(
        `Dialect ${config.dialect} is not yet supported. Only PostgreSQL and SQLite are currently supported.`
      );
    }
    
    throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
  } catch (error) {
    console.error('Database truncate failed:', error);
    return {
      success: false,
      tablesTruncated: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}