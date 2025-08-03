import type { Config } from 'drizzle-kit';
import type { ResetResult } from '@makeco/db-cli/types';
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
 * Resets the database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetDatabase(config: Config): Promise<ResetResult> {
  try {
    console.log(`Resetting ${config.dialect} database...`);
    
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, resetPostgresDatabase } = await import('@makeco/db-cli/dialects/postgres');
      const connection = await preparePostgresDB(credentials);
      return await resetPostgresDatabase(connection);
    }
    
    if (isSqliteConfig(config)) {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, resetSqliteDatabase } = await import('@makeco/db-cli/dialects/sqlite');
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

// ========================================================================
// CLI EXECUTION FUNCTION
// ========================================================================

/**
 * Executes database reset (clears data)
 */
export async function executeReset(config: Config): Promise<void> {
  console.log('\n📋 Resetting database data...');
  
  try {
    const result = await resetDatabase(config);
    
    if (result.success) {
      console.log(`✅ Database reset completed successfully!`);
      if (result.tablesDropped.length > 0) {
        console.log(`Dropped ${result.tablesDropped.length} tables/schemas:`, result.tablesDropped.join(', '));
      }
    } else {
      throw new Error(result.error || 'Database reset failed');
    }
  } catch (error) {
    console.error('❌ Database reset failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}