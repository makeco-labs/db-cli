import { sql } from 'drizzle-orm';
import type { TursoConnection } from './connection.turso';
import type { CheckResult } from '@makeco/db-cli/types';

/**
 * Checks Turso database connection
 */
export async function checkTursoConnection(connection: TursoConnection): Promise<CheckResult> {
  try {
    // Get SQLite version (Turso is built on LibSQL which is SQLite-compatible)
    const version = connection.db.all(sql`SELECT sqlite_version() AS version`);
    const versionString = version[0]?.version as string;

    // Perform a simple health check query
    connection.db.run(sql`SELECT 1`);

    console.log(`Turso connection successful (SQLite version: ${versionString})`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: `Turso (SQLite ${versionString})`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    console.error(`Turso connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}