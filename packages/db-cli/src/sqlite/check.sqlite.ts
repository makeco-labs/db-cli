import { sql } from 'drizzle-orm';
import type { SQLiteConnection } from './connection.sqlite';
import type { CheckResult } from '@makeco/db-cli/types';

/**
 * Checks SQLite database connection
 */
export async function checkSqliteConnection(connection: SQLiteConnection): Promise<CheckResult> {
  try {

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