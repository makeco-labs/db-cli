import type { Config } from 'drizzle-kit';
import type { TruncateResult } from '@makeco/db-cli/types';
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
 * Truncates the database by deleting all data from user tables while preserving 
 * table structure and system tables
 */
export async function truncateDatabase(config: Config): Promise<TruncateResult> {
  try {
    console.log(`Truncating ${config.dialect} database...`);
    
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, truncatePostgresDatabase } = await import('@makeco/db-cli/dialects/postgres');
      const connection = await preparePostgresDB(credentials);
      return await truncatePostgresDatabase(connection);
    }
    
    if (isSqliteConfig(config)) {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, truncateSQLiteDatabase } = await import('@makeco/db-cli/dialects/sqlite');
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

// ========================================================================
// CLI EXECUTION FUNCTION
// ========================================================================

/**
 * Executes database truncate (delete data, keep structure)
 */
export async function executeTruncate(config: Config): Promise<void> {
  console.log('\n🗑️ Truncating database data...');
  
  try {
    const result = await truncateDatabase(config);
    
    if (result.success) {
      console.log(`✅ Database truncate completed successfully!`);
      if (result.tablesTruncated.length > 0) {
        console.log(`Truncated ${result.tablesTruncated.length} tables:`, result.tablesTruncated.join(', '));
      }
    } else {
      throw new Error(result.error || 'Database truncate failed');
    }
  } catch (error) {
    console.error('❌ Database truncate failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}