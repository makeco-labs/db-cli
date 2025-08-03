import type { Config } from 'drizzle-kit';
import type { TruncateResult } from '@makeco/db-cli/types';
import {
  isPostgresConfig,
  isSqliteConfig,
  isMysqlConfig,
  isTursoConfig,
  isSingleStoreConfig,
  isGelConfig,
  extractPostgresCredentials,
  extractSqliteCredentials,
  extractTursoCredentials,
  extractMysqlCredentials,
  extractSingleStoreCredentials,
  extractGelCredentials,
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
      if (isTursoConfig(config)) {
        const credentials = extractTursoCredentials(config);
        const { prepareTursoDB, truncateTursoDatabase } = await import('@makeco/db-cli/dialects/turso');
        const connection = await prepareTursoDB(credentials);
        return await truncateTursoDatabase(connection);
      } else {
        const credentials = extractSqliteCredentials(config);
        const { prepareSQLiteDB, truncateSQLiteDatabase } = await import('@makeco/db-cli/dialects/sqlite');
        const connection = await prepareSQLiteDB(credentials);
        return await truncateSQLiteDatabase(connection);
      }
    }
    
    if (isMysqlConfig(config)) {
      const credentials = extractMysqlCredentials(config);
      const { prepareMysqlDB, truncateMysqlDatabase } = await import('@makeco/db-cli/dialects/mysql');
      const connection = await prepareMysqlDB(credentials);
      return await truncateMysqlDatabase(connection);
    }
    
    if (isSingleStoreConfig(config)) {
      const credentials = extractSingleStoreCredentials(config);
      const { prepareSingleStoreDB, truncateSingleStoreDatabase } = await import('@makeco/db-cli/dialects/singlestore');
      const connection = await prepareSingleStoreDB(credentials);
      return await truncateSingleStoreDatabase(connection);
    }
    
    if (isGelConfig(config)) {
      const credentials = extractGelCredentials(config);
      const { prepareGelDB, truncateGelDatabase } = await import('@makeco/db-cli/dialects/gel');
      const connection = await prepareGelDB(credentials);
      return await truncateGelDatabase(connection);
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