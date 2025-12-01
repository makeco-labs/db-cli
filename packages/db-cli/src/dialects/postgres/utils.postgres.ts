import { sql } from 'drizzle-orm';

import type { PostgresConnection } from './types.postgres';

// Tables and schemas to preserve during operations
export const tableAllowlist = [
  'pg_toast',
  'migrations',
  'drizzle_migrations',
  'drizzle_query_log',
  'drizzle_query_log_entries',
];

export const schemaAllowlist = ['information_schema', 'pg_catalog', 'pg_toast'];

// Patterns for extension-owned schemas that should never be dropped
export const schemaBlocklistPatterns = [
  /^_timescaledb_/, // TimescaleDB internal schemas
  /^timescaledb_/, // TimescaleDB public schemas
  /^postgis/, // PostGIS schemas
  /^tiger$/, // PostGIS TIGER geocoder
  /^tiger_data$/, // PostGIS TIGER data
  /^topology$/, // PostGIS topology
];

// ========================================================================
// VERSION FORMATTING
// ========================================================================

// Regex for parsing PostgreSQL version strings
const POSTGRES_VERSION_REGEX =
  /PostgreSQL (\d+\.\d+)(?:\.\d+)?\s*(?:on\s+([^,]+))?/;

/**
 * Formats PostgreSQL version string for cleaner display
 * Example: "PostgreSQL 17.5 on aarch64-unknown-linux-musl, compiled by gcc..."
 * Becomes: "PostgreSQL 17.5 on aarch64-unknown-linux-musl"
 */
export function formatPostgresVersion(version: string): string {
  // Extract version number and platform from PostgreSQL version string
  const match = version.match(POSTGRES_VERSION_REGEX);
  if (match) {
    const [, versionNum, platform] = match;
    if (platform) {
      return `PostgreSQL ${versionNum} on ${platform}`;
    }
    return `PostgreSQL ${versionNum}`;
  }

  // Fallback to truncated version if pattern doesn't match
  return version.length > 50 ? `${version.substring(0, 47)}...` : version;
}

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
 * Gets row count for a specific table
 */
export async function getTableRowCount(
  connection: PostgresConnection,
  schemaName: string,
  tableName: string
): Promise<number> {
  try {
    const statement = sql`SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.${sql.identifier(tableName)}`;
    const result = await connection.db.execute(statement);

    // Handle different result formats from different drivers
    const rows = Array.isArray(result) ? result : result.rows || [result];
    const count = (rows as Array<{ count: string | number }>)[0]?.count;

    return typeof count === 'string' ? Number.parseInt(count, 10) : count || 0;
  } catch (error) {
    console.warn(
      `Failed to get row count for ${schemaName}.${tableName}:`,
      error instanceof Error ? error.message : error
    );
    return 0;
  }
}

/**
 * Checks if a schema is owned by an extension and should be excluded
 */
function isExtensionOwnedSchema(schema: string): boolean {
  return schemaBlocklistPatterns.some((pattern) => pattern.test(schema));
}

/**
 * Gets all user schemas (excluding system schemas and extension-owned schemas)
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
    .filter((schema) => {
      if (schemaAllowlist.includes(schema) || schema === 'public') {
        return false;
      }
      // Filter out extension-owned schemas
      if (isExtensionOwnedSchema(schema)) {
        return false;
      }
      return true;
    });
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
