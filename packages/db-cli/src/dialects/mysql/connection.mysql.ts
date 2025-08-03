import z, {
  coerce,
  object,
  string,
  TypeOf,
  union,
} from "zod";
import { checkPackage } from "../../utils";
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless';

// ========================================================================
// TYPES
// ========================================================================

export interface MysqlConnection {
  db:
    | MySql2Database<Record<string, never>>
    | PlanetScaleDatabase<Record<string, never>>;
}

// MySQL credentials type derived from drizzle-kit's validation schema
export const mysqlCredentials = union([
  object({
    driver: z.undefined(),
    host: string().min(1),
    port: coerce.number().min(1).optional(),
    user: string().min(1).optional(),
    password: string().min(1).optional(),
    database: string().min(1),
    ssl: union([
      string(),
      object({
        pfx: string().optional(),
        key: string().optional(),
        passphrase: string().optional(),
        cert: string().optional(),
        ca: union([string(), string().array()]).optional(),
        crl: union([string(), string().array()]).optional(),
        ciphers: string().optional(),
        rejectUnauthorized: z.boolean().optional(),
      }),
    ]).optional(),
  }),
  object({
    driver: z.undefined(),
    url: string().min(1),
  }),
]);

export type MysqlCredentials = TypeOf<typeof mysqlCredentials>;

// ========================================================================
// CONNECTION FUNCTIONS
// ========================================================================

/**
 * Prepares a MySQL database connection using available drivers
 * Supports mysql2 and @planetscale/database
 */
export async function prepareMysqlDB(credentials: MysqlCredentials): Promise<MysqlConnection> {
  // Try mysql2 first
  if (await checkPackage("mysql2")) {
    console.log(`Using 'mysql2' driver for database querying`);
    const { createConnection } = await import("mysql2/promise");
    const { drizzle } = await import("drizzle-orm/mysql2");

    const connection = 'url' in credentials
      ? await createConnection(credentials.url)
      : await createConnection({
          host: credentials.host,
          port: credentials.port,
          user: credentials.user,
          password: credentials.password,
          database: credentials.database,
          ssl: credentials.ssl,
        });

    const db = drizzle(connection);
    return { db };
  }

  // Try PlanetScale
  if (await checkPackage("@planetscale/database")) {
    console.log(`Using '@planetscale/database' driver for database querying`);
    const { Client } = await import("@planetscale/database");
    const { drizzle } = await import("drizzle-orm/planetscale-serverless");

    if (!('url' in credentials)) {
      throw new Error(
        "@planetscale/database driver only supports URL connections"
      );
    }

    const client = new Client({ url: credentials.url });
    const db = drizzle(client);
    return { db };
  }

  throw new Error(
    "Please install either 'mysql2' or '@planetscale/database' for Drizzle Kit to connect to MySQL databases"
  );
}