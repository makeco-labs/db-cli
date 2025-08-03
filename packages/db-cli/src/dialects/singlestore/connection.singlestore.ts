import z, {
  coerce,
  object,
  string,
  TypeOf,
  union,
} from "zod";
import { checkPackage } from "../../utils";
import type { SingleStoreDatabase } from 'drizzle-orm/singlestore';

// ========================================================================
// TYPES
// ========================================================================

export interface SingleStoreConnection {
  db: SingleStoreDatabase<any, any, Record<string, never>>;
}

// SingleStore credentials type (similar to MySQL as it uses mysql2 driver)
export const singleStoreCredentials = union([
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

export type SingleStoreCredentials = TypeOf<typeof singleStoreCredentials>;

// ========================================================================
// CONNECTION FUNCTIONS
// ========================================================================

/**
 * Prepares a SingleStore database connection using mysql2 driver
 * SingleStore is MySQL-compatible and uses the same driver
 */
export async function prepareSingleStoreDB(credentials: SingleStoreCredentials): Promise<SingleStoreConnection> {
  if (await checkPackage("mysql2")) {
    console.log(`Using 'mysql2' driver for SingleStore database querying`);
    const { createConnection } = await import("mysql2/promise");
    const { drizzle } = await import("drizzle-orm/singlestore");

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

  throw new Error(
    "Please install 'mysql2' for Drizzle Kit to connect to SingleStore databases"
  );
}