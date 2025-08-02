import { sql } from 'drizzle-orm';
import { preparePostgresDB } from './connection.postgres';
import { isPostgresConfig, extractPostgresCredentials } from '../utils';

import type { Config } from 'drizzle-kit';
import type { CheckResult } from '../types';

/**
 * Checks PostgreSQL database connection
 */
export async function checkPostgresConnection(config: Config): Promise<CheckResult> {
  if (!isPostgresConfig(config)) {
    return {
      status: 'error',
      message: 'Invalid PostgreSQL configuration',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const credentials = extractPostgresCredentials(config);
    const connection = await preparePostgresDB(credentials);

    // Get PostgreSQL version
    const version = await connection.db.execute(sql`SELECT version() AS version`);
    const versionString = version[0]?.version as string;

    // Perform a simple health check query
    await connection.db.execute(sql`SELECT 1`);

    console.log(`PostgreSQL connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: versionString,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    console.error(`PostgreSQL connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}