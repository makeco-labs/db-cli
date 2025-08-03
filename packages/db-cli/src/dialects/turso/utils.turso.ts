import { sql } from 'drizzle-orm';

import type { TursoConnection } from './types.turso';

// System tables that should not be dropped/truncated (same as SQLite since Turso is LibSQL/SQLite-compatible)
const SYSTEM_TABLES = [
  'sqlite_sequence',
  'sqlite_master',
  'sqlite_temp_master',
];

// Migration/history tables to preserve
const PRESERVED_TABLES = [
  '__drizzle_migrations',
  'drizzle_migrations',
  '__drizzle_migrations_journal',
];

/**
 * Gets all user tables from Turso database
 */
export async function getTables(
  connection: TursoConnection
): Promise<string[]> {
  const statement = sql`SELECT name FROM sqlite_master WHERE type='table'`;
  const result = await connection.db.all(statement);

  const tables = result
    .map((row: any) => row.name)
    .filter(
      (table: string) =>
        !(SYSTEM_TABLES.includes(table) || PRESERVED_TABLES.includes(table))
    );

  return tables;
}
