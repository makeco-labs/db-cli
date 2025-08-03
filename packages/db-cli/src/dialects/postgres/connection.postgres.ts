import type {
  AwsDataApiPgDatabase,
  AwsDataApiSessionOptions,
} from 'drizzle-orm/aws-data-api/pg';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres';
import ws from 'ws';
import z, {
  boolean,
  coerce,
  literal,
  object,
  string,
  type TypeOf,
  union,
} from 'zod';
import { checkPackage } from '../../utils';

// ========================================================================
// TYPES
// ========================================================================

export interface PostgresConnection {
  db:
    | AwsDataApiPgDatabase<Record<string, never>>
    | PgliteDatabase<Record<string, never>>
    | NodePgDatabase<Record<string, never>>
    | PostgresJsDatabase<Record<string, never>>
    | VercelPgDatabase<Record<string, never>>
    | NeonDatabase<Record<string, never>>;
}

// PostgreSQL credentials type derived from drizzle-kit's validation schema
export const postgresCredentials = union([
  object({
    driver: z.undefined(),
    host: string().min(1),
    port: coerce.number().min(1).optional(),
    user: string().min(1).optional(),
    password: string().min(1).optional(),
    database: string().min(1),
    ssl: union([
      literal('require'),
      literal('allow'),
      literal('prefer'),
      literal('verify-full'),
      boolean(),
      object({}).passthrough(),
    ]).optional(),
  }).transform((o) => {
    o.driver = undefined;
    return o as Omit<typeof o, 'driver'>;
  }),
  object({
    driver: z.undefined(),
    url: string().min(1),
  }).transform<{ url: string }>((o) => {
    o.driver = undefined;
    return o;
  }),
  object({
    driver: literal('aws-data-api'),
    database: string().min(1),
    secretArn: string().min(1),
    resourceArn: string().min(1),
  }),
  object({
    driver: literal('pglite'),
    url: string().min(1),
  }),
]);

export type PostgresCredentials = TypeOf<typeof postgresCredentials>;

// ========================================================================
// PREPARE DB
// ========================================================================

export const preparePostgresDB = async (
  credentials: PostgresCredentials
): Promise<PostgresConnection> => {
  if ('driver' in credentials) {
    const { driver } = credentials;
    if (driver === 'aws-data-api') {
      const { RDSDataClient } = await import('@aws-sdk/client-rds-data');
      const { drizzle } = await import('drizzle-orm/aws-data-api/pg');

      const config: AwsDataApiSessionOptions = {
        database: credentials.database,
        resourceArn: credentials.resourceArn,
        secretArn: credentials.secretArn,
      };
      const rdsClient = new RDSDataClient();

      const db = drizzle(rdsClient, config);

      return { db };
    }

    if (driver === 'pglite') {
      const { PGlite } = await import('@electric-sql/pglite');
      const { drizzle } = await import('drizzle-orm/pglite');

      const pglite = new PGlite(credentials.url);
      await pglite.waitReady;
      const db = drizzle(pglite);

      return { db };
    }
  }

  if (await checkPackage('pg')) {
    console.log(`Using 'pg' driver for database querying`);
    const { default: pg } = await import('node_modules/@types/pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    const ssl =
      'ssl' in credentials
        ? credentials.ssl === 'prefer' ||
          credentials.ssl === 'require' ||
          credentials.ssl === 'allow'
          ? { rejectUnauthorized: false }
          : credentials.ssl === 'verify-full'
            ? {}
            : credentials.ssl
        : {};

    const client =
      'url' in credentials
        ? new pg.Pool({ connectionString: credentials.url, max: 1 })
        : new pg.Pool({ ...credentials, ssl, max: 1 });

    const db = drizzle(client);

    return { db };
  }

  if (await checkPackage('postgres')) {
    console.log(`Using 'postgres' driver for database querying`);
    const postgres = await import('postgres');

    const { drizzle } = await import('drizzle-orm/postgres-js');

    const client =
      'url' in credentials
        ? postgres.default(credentials.url, { max: 1 })
        : postgres.default({ ...credentials, max: 1 });

    const transparentParser = (val: unknown) => val;

    // Override postgres.js default date parsers: https://github.com/porsager/postgres/discussions/761
    // These are PostgreSQL type OIDs for timestamp types
    const timestampTypes = ['1184', '1082', '1083', '1114'] as const;
    for (const type of timestampTypes) {
      client.options.parsers[type] = transparentParser;
      client.options.serializers[type] = transparentParser;
    }
    client.options.serializers['114'] = transparentParser;
    client.options.serializers['3802'] = transparentParser;

    const db = drizzle(client);

    return { db };
  }

  if (await checkPackage('@vercel/postgres')) {
    console.log(`Using '@vercel/postgres' driver for database querying`);
    console.log(
      "'@vercel/postgres' can only connect to remote Neon/Vercel Postgres/Supabase instances through a websocket"
    );
    const { VercelPool } = await import('@vercel/postgres');
    const { drizzle } = await import('drizzle-orm/vercel-postgres');
    const ssl =
      'ssl' in credentials
        ? credentials.ssl === 'prefer' ||
          credentials.ssl === 'require' ||
          credentials.ssl === 'allow'
          ? { rejectUnauthorized: false }
          : credentials.ssl === 'verify-full'
            ? {}
            : credentials.ssl
        : {};

    const client =
      'url' in credentials
        ? new VercelPool({ connectionString: credentials.url })
        : new VercelPool({ ...credentials, ssl });

    await client.connect();

    const db = drizzle(client);

    return { db };
  }

  if (await checkPackage('@neondatabase/serverless')) {
    console.log(
      `Using '@neondatabase/serverless' driver for database querying`
    );
    console.log(
      "'@neondatabase/serverless' can only connect to remote Neon/Vercel Postgres/Supabase instances through a websocket"
    );
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');

    const ssl =
      'ssl' in credentials
        ? credentials.ssl === 'prefer' ||
          credentials.ssl === 'require' ||
          credentials.ssl === 'allow'
          ? { rejectUnauthorized: false }
          : credentials.ssl === 'verify-full'
            ? {}
            : credentials.ssl
        : {};

    const client =
      'url' in credentials
        ? new (Pool as any)({ connectionString: credentials.url, max: 1 })
        : new (Pool as any)({ ...credentials, max: 1, ssl });
    neonConfig.webSocketConstructor = ws;

    const db = drizzle(client);

    return { db };
  }

  console.error(
    "To connect to Postgres database - please install either of 'pg', 'postgres', '@neondatabase/serverless' or '@vercel/postgres' drivers"
  );
  process.exit(1);
};
