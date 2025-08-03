import type { Config } from 'drizzle-kit';
import type { CheckResult } from '@makeco/db-cli/types';
import {
  isPostgresConfig,
  isSqliteConfig,
  extractPostgresCredentials,
  extractSqliteCredentials,
} from '@makeco/db-cli/utils';

// ========================================================================
// COORDINATOR FUNCTION
// ========================================================================

/**
 * Checks database connection based on the dialect
 */
export async function checkConnection(config: Config): Promise<CheckResult> {
  try {
    console.log(`Checking ${config.dialect} database connection...`);
    
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, checkPostgresConnection } = await import('@makeco/db-cli/dialects/postgres');
      const connection = await preparePostgresDB(credentials);
      return await checkPostgresConnection(connection);
    }
    
    if (isSqliteConfig(config)) {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, checkSqliteConnection } = await import('@makeco/db-cli/dialects/sqlite');
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

// ========================================================================
// CLI EXECUTION FUNCTION
// ========================================================================

/**
 * Executes database connection check
 */
export async function executeCheck(config: Config): Promise<void> {
  console.log('\n🔍 Checking database connection...');
  
  try {
    const result = await checkConnection(config);
    
    if (result.status === 'ok') {
      console.log(`✅ Database connection successful!`);
      if (result.version) {
        console.log(`Database version: ${result.version}`);
      }
      console.log(`Status: ${result.status} at ${result.timestamp}`);
    } else {
      throw new Error(result.message || 'Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}