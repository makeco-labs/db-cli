import type { Config } from 'drizzle-kit';
import { sql } from 'drizzle-orm';
import { preparePostgresDB } from './connection.postgres';
import type { ResetResult } from '../reset';
import { isPostgresConfig, extractPostgresCredentials } from '../utils';

// Tables and schemas to preserve during reset
const tableAllowlist = [
  'pg_toast',
  'migrations',
  'drizzle_migrations',
  'drizzle_query_log',
  'drizzle_query_log_entries',
];

const schemaAllowlist = [
  'information_schema',
  'pg_catalog',
  'pg_toast',
  'public',
];

/**
 * Gets all user tables in the public schema
 */
async function getTables(connection: Awaited<ReturnType<typeof preparePostgresDB>>): Promise<string[]> {
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
    .filter(table => !tableAllowlist.includes(table));
}

/**
 * Gets all user schemas (excluding system schemas)
 */
async function getSchemas(connection: Awaited<ReturnType<typeof preparePostgresDB>>): Promise<string[]> {
  const statement = sql`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
  `;
  const result = await connection.db.execute(statement);
  
  // Handle different result formats from different drivers
  const schemas = Array.isArray(result) ? result : result.rows || [result];
  
  return (schemas as Array<{ schema_name: string }>)
    .map((row) => row.schema_name)
    .filter(schema => !schemaAllowlist.includes(schema));
}

/**
 * Resets PostgreSQL database by dropping all user tables and schemas
 */
export async function resetPostgresDatabase(config: Config): Promise<ResetResult> {
  if (!isPostgresConfig(config)) {
    throw new Error('resetPostgresDatabase can only be used with PostgreSQL configs');
  }

  const credentials = extractPostgresCredentials(config);
  const connection = await preparePostgresDB(credentials);
  const tablesDropped: string[] = [];
  
  try {
    const tables = await getTables(connection);
    console.log("Tables to drop:", tables.join(", "));
    for (const table of tables) {
      const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE`;
      await connection.db.execute(dropStatement);
      tablesDropped.push(table);
      console.log(`Dropped table: ${table}`);
    }

    const schemas = await getSchemas(connection);
    console.log("Schemas to drop:", schemas.join(", "));
    for (const schema of schemas) {
      if (schema !== "public") {
        const dropStatement = sql`DROP SCHEMA IF EXISTS ${sql.identifier(schema)} CASCADE`;
        await connection.db.execute(dropStatement);
        tablesDropped.push(`schema:${schema}`);
        console.log(`Dropped schema: ${schema}`);
      }
    }

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