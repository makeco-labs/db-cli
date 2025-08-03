import { sql } from 'drizzle-orm';
import type { PostgresConnection } from './connection.postgres';

// Tables and schemas to preserve during operations
export const tableAllowlist = [
  'pg_toast',
  'migrations',
  'drizzle_migrations',
  'drizzle_query_log',
  'drizzle_query_log_entries',
];

export const schemaAllowlist = ['information_schema', 'pg_catalog', 'pg_toast'];

/**
 * Gets all user tables in the public schema
 */
export async function getTables(
  connection: PostgresConnection
): Promise<string[]> {
  const statement = sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  const result = await connection.db.execute(statement);

  // Handle different result formats from different drivers
  const tables = Array.isArray(result) ? result : result.rows || [result];

  return (tables as Array<{ table_name: string }>)
    .map((row) => row.table_name)
    .filter((table) => !tableAllowlist.includes(table));
}

/**
 * Gets all user schemas (excluding system schemas)
 */
export async function getSchemas(
  connection: PostgresConnection
): Promise<string[]> {
  const statement = sql`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  `;
  const result = await connection.db.execute(statement);

  // Handle different result formats from different drivers
  const schemas = Array.isArray(result) ? result : result.rows || [result];

  return (schemas as Array<{ schema_name: string }>)
    .map((row) => row.schema_name)
    .filter(
      (schema) => !schemaAllowlist.includes(schema) && schema !== 'public'
    );
}

/**
 * Gets all user tables in non-public schemas
 */
export async function getTablesInSchemas(
  connection: PostgresConnection,
  schemas: string[]
): Promise<string[]> {
  if (schemas.length === 0) {
    return [];
  }

  const schemaList = schemas.map((schema) => `'${schema}'`).join(', ');
  const statement = sql`
    SELECT table_schema || '.' || table_name as full_table_name
    FROM information_schema.tables
    WHERE table_schema IN (${sql.raw(schemaList)}) AND table_type = 'BASE TABLE'
  `;
  const result = await connection.db.execute(statement);

  // Handle different result formats from different drivers
  const tables = Array.isArray(result) ? result : result.rows || [result];

  return (tables as Array<{ full_table_name: string }>).map(
    (row) => row.full_table_name
  );
}
