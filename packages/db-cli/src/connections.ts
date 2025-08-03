import type { Config } from 'drizzle-kit';
import type { DatabaseConnection } from '@makeco/db-cli/types';
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

/**
 * Creates a database connection based on the drizzle config using drizzle-kit patterns
 * Supports PostgreSQL, SQLite, Turso, MySQL, SingleStore, and Gel
 */
export async function createConnection(config: Config): Promise<DatabaseConnection> {
  if (isPostgresConfig(config)) {
    const { preparePostgresDB } = await import('@makeco/db-cli/dialects/postgres');
    const credentials = extractPostgresCredentials(config);
    return await preparePostgresDB(credentials);
  }

  if (isSqliteConfig(config)) {
    if (isTursoConfig(config)) {
      const credentials = extractTursoCredentials(config);
      const { prepareTursoDB } = await import('@makeco/db-cli/dialects/turso');
      return await prepareTursoDB(credentials);
    } else {
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB } = await import('@makeco/db-cli/dialects/sqlite');
      return await prepareSQLiteDB(credentials);
    }
  }

  if (isMysqlConfig(config)) {
    const { prepareMysqlDB } = await import('@makeco/db-cli/dialects/mysql');
    const credentials = extractMysqlCredentials(config);
    return await prepareMysqlDB(credentials);
  }

  if (isSingleStoreConfig(config)) {
    const { prepareSingleStoreDB } = await import('@makeco/db-cli/dialects/singlestore');
    const credentials = extractSingleStoreCredentials(config);
    return await prepareSingleStoreDB(credentials);
  }

  if (isGelConfig(config)) {
    const { prepareGelDB } = await import('@makeco/db-cli/dialects/gel');
    const credentials = extractGelCredentials(config);
    return await prepareGelDB(credentials);
  }

  // This should be unreachable if all Config union members are handled
  throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
}