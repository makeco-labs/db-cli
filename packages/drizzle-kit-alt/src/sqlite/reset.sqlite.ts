import { sql } from 'drizzle-orm';
import { prepareSQLiteDB } from './connection.sqlite';
import { isSqliteConfig, extractSqliteCredentials } from '../utils';

import type { Config } from 'drizzle-kit';
import type { ResetResult } from '../reset';

// Tables to preserve during reset
const tableAllowlist = [
  'sqlite_sequence',
  'sqlite_master',
  'migrations',
  'drizzle_migrations',
  'drizzle_query_log',
  'drizzle_query_log_entries',
];

/**
 * Gets all user tables in the database
 */
async function getTables(connection: Awaited<ReturnType<typeof prepareSQLiteDB>>): Promise<string[]> {
  const statement = sql`SELECT name FROM sqlite_master WHERE type='table'`;
  const result = connection.db.all(statement); // Using db.all() to fetch all tables

  // Handle different result formats from different drivers
  const tables = Array.isArray(result) ? result : [result];

  return (tables as Array<{ name: string }>)
    .map((row) => row.name) // Extract table names
    .filter(table => !tableAllowlist.includes(table));
}

/**
 * Resets SQLite database by dropping all user tables
 */
export async function resetSqliteDatabase(config: Config): Promise<ResetResult> {
  if (!isSqliteConfig(config)) {
    throw new Error('resetSqliteDatabase can only be used with SQLite configs');
  }

  const credentials = extractSqliteCredentials(config);
  const connection = await prepareSQLiteDB(credentials);
  const tablesDropped: string[] = [];

  try {
    // Turn off foreign key checks
    connection.db.run(sql`PRAGMA foreign_keys = OFF`);
    console.log("Foreign keys disabled");

    const tables = await getTables(connection); // Get all table names
    console.log("Tables to drop:", tables.join(", "));
    for (const table of tables) {
      const deleteStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`;
      connection.db.run(deleteStatement); // Drop each table
      tablesDropped.push(table);
      console.log(`Dropped table: ${table}`);
    }

    // Turn foreign key checks back on
    connection.db.run(sql`PRAGMA foreign_keys = ON`);
    console.log("Foreign keys enabled");

    console.log("Schema reset completed");
    return {
      success: true,
      tablesDropped,
    };
  } catch (e) {
    console.error("Error resetting schema:", e);
    throw e;
  }
}