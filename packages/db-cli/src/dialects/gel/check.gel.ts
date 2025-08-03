import type { CheckResult } from '@makeco/db-cli/types';
import { sql } from 'drizzle-orm';
import type { GelConnection } from './connection.gel';

/**
 * Checks Gel database connection
 */
export async function checkGelConnection(
  connection: GelConnection
): Promise<CheckResult> {
  try {
    // Get Gel version (this is a placeholder - actual implementation may vary)
    const version = await connection.db.execute(
      sql`SELECT VERSION() AS version`
    );
    const versionString = (version[0]?.version as string) || 'Gel Database';

    // Perform a simple health check query
    await connection.db.execute(sql`SELECT 1`);

    console.log(`Gel connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: versionString,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    console.error(`Gel connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
