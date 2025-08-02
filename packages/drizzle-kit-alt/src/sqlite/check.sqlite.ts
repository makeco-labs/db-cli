import { sql } from 'drizzle-orm';
import { prepareSQLiteDB } from './connection.sqlite';
import { isSqliteConfig, extractSqliteCredentials } from '../utils';

import type { Config } from 'drizzle-kit';
import type { CheckResult } from '../types';

/**
 * Checks SQLite database connection
 */
export async function checkSqliteConnection(config: Config): Promise<CheckResult> {
  if (!isSqliteConfig(config)) {
    return {
      status: 'error',
      message: 'Invalid SQLite configuration',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const credentials = extractSqliteCredentials(config);
    const connection = await prepareSQLiteDB(credentials);

    // Get SQLite version
    const version = connection.db.all(sql`SELECT sqlite_version() AS version`);
    const versionString = version[0]?.version as string;

    // Perform a simple health check query
    connection.db.run(sql`SELECT 1`);

    console.log(`SQLite connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: versionString,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    console.error(`SQLite connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}