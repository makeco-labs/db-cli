import type { Config } from 'drizzle-kit';
import type { CheckResult } from './types';
import {
  isPostgresConfig,
  isSqliteConfig,
  extractPostgresCredentials,
  extractSqliteCredentials,
} from './utils';

/**
 * Checks database connection based on the dialect
 */
export async function checkConnection(config: Config): Promise<CheckResult> {
  try {
    console.log(`Checking ${config.dialect} database connection...`);
    
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, checkPostgresConnection } = await import('./postgres');
      const connection = await preparePostgresDB(credentials);
      return await checkPostgresConnection(connection);
    }
    
    if (isSqliteConfig(config)) {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, checkSqliteConnection } = await import('./sqlite');
      const connection = await prepareSQLiteDB(credentials);
      return await checkSqliteConnection(connection);
    }
    
    // Handle unsupported dialects
    if (config.dialect === 'mysql' || config.dialect === 'singlestore' || config.dialect === 'gel') {
      throw new Error(
        `Dialect ${config.dialect} is not yet supported. Only PostgreSQL and SQLite are currently supported.`
      );
    }
    
    throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
  } catch (error) {
    console.error('Database connection check failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}