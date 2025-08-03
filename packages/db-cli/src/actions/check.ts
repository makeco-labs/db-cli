import type { CheckResult } from '@makeco/db-cli/types';
import {
  extractGelCredentials,
  extractMysqlCredentials,
  extractPostgresCredentials,
  extractSingleStoreCredentials,
  extractSqliteCredentials,
  extractTursoCredentials,
  isGelConfig,
  isMysqlConfig,
  isPostgresConfig,
  isSingleStoreConfig,
  isSqliteConfig,
  isTursoConfig,
} from '@makeco/db-cli/utils';
import type { Config } from 'drizzle-kit';

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
      const { preparePostgresDB, checkPostgresConnection } = await import(
        '@makeco/db-cli/dialects/postgres'
      );
      const connection = await preparePostgresDB(credentials);
      return await checkPostgresConnection(connection);
    }

    if (isSqliteConfig(config)) {
      if (isTursoConfig(config)) {
        const credentials = extractTursoCredentials(config);
        const { prepareTursoDB, checkTursoConnection } = await import(
          '@makeco/db-cli/dialects/turso'
        );
        const connection = await prepareTursoDB(credentials);
        return await checkTursoConnection(connection);
      }
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, checkSqliteConnection } = await import(
        '@makeco/db-cli/dialects/sqlite'
      );
      const connection = await prepareSQLiteDB(credentials);
      return await checkSqliteConnection(connection);
    }

    if (isMysqlConfig(config)) {
      const credentials = extractMysqlCredentials(config);
      const { prepareMysqlDB, checkMysqlConnection } = await import(
        '@makeco/db-cli/dialects/mysql'
      );
      const connection = await prepareMysqlDB(credentials);
      return await checkMysqlConnection(connection);
    }

    if (isSingleStoreConfig(config)) {
      const credentials = extractSingleStoreCredentials(config);
      const { prepareSingleStoreDB, checkSingleStoreConnection } = await import(
        '@makeco/db-cli/dialects/singlestore'
      );
      const connection = await prepareSingleStoreDB(credentials);
      return await checkSingleStoreConnection(connection);
    }

    if (isGelConfig(config)) {
      const credentials = extractGelCredentials(config);
      const { prepareGelDB, checkGelConnection } = await import(
        '@makeco/db-cli/dialects/gel'
      );
      const connection = await prepareGelDB(credentials);
      return await checkGelConnection(connection);
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
      console.log('✅ Database connection successful!');
      if (result.version) {
        console.log(`Database version: ${result.version}`);
      }
      console.log(`Status: ${result.status} at ${result.timestamp}`);
    } else {
      throw new Error(result.message || 'Database connection failed');
    }
  } catch (error) {
    console.error(
      '❌ Database connection failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}
