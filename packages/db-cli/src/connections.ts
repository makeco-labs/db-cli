import type { Config } from 'drizzle-kit';
import type { DatabaseConnection } from './types';
import {
  isPostgresConfig,
  isSqliteConfig,
  extractPostgresCredentials,
  extractSqliteCredentials,
} from './utils';

/**
 * Creates a database connection based on the drizzle config using drizzle-kit patterns
 * Currently supports PostgreSQL and SQLite
 */
export async function createConnection(config: Config): Promise<DatabaseConnection> {
  if (isPostgresConfig(config)) {
    const { preparePostgresDB } = await import('./postgres');
    const credentials = extractPostgresCredentials(config);
    return await preparePostgresDB(credentials);
  }

  if (isSqliteConfig(config)) {
    const { prepareSQLiteDB } = await import('./sqlite');
    const credentials = extractSqliteCredentials(config);
    return await prepareSQLiteDB(credentials);
  }

  // Handle unsupported dialects
  if (config.dialect === 'mysql' || config.dialect === 'singlestore' || config.dialect === 'gel') {
    throw new Error(
      `Dialect ${config.dialect} is not yet supported. Only PostgreSQL and SQLite are currently supported.`
    );
  }

  // This should be unreachable if all Config union members are handled
  throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
}