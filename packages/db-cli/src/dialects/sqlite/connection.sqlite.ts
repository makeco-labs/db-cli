import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import fetch from 'node-fetch';
import { literal, object, string, union, undefined as zUndefined } from 'zod';
import { checkPackage, normalizeSQLiteUrl } from '../../utils';

// ========================================================================
// TYPES
// ========================================================================

export interface SQLiteConnection {
  db:
    | LibSQLDatabase<Record<string, never>>
    | BetterSQLite3Database<Record<string, never>>
    | SqliteRemoteDatabase<Record<string, never>>;
}

export const sqliteCredentials = union([
  object({
    driver: literal('turso'),
    url: string().min(1),
    authToken: string().min(1).optional(),
  }),
  object({
    driver: literal('d1-http'),
    accountId: string().min(1),
    databaseId: string().min(1),
    token: string().min(1),
  }),
  object({
    driver: zUndefined(),
    url: string().min(1),
  }).transform<{ url: string }>((o) => {
    o.driver = undefined;
    return o;
  }),
]);

export type SqliteCredentials =
  | {
      driver: 'turso';
      url: string;
      authToken?: string;
    }
  | {
      driver: 'd1-http';
      accountId: string;
      databaseId: string;
      token: string;
    }
  | {
      url: string;
    };

// ========================================================================
// CREATE
// ========================================================================

export const connectToSQLite = async (
  credentials: SqliteCredentials
): Promise<SQLiteConnection> => {
  if ('driver' in credentials) {
    const { driver } = credentials;
    if (driver === 'turso') {
      const { createClient } = await import('@libsql/client');
      const { drizzle } = await import('drizzle-orm/libsql');

      const client = createClient({
        url: normalizeSQLiteUrl(credentials.url, 'libsql'),
        authToken: credentials.authToken,
      });
      const db = drizzle(client);

      return { db };
    }

    if (driver === 'd1-http') {
      const { drizzle } = await import('drizzle-orm/sqlite-proxy');

      type D1Response =
        | {
            success: true;
            result: {
              results:
                | unknown[]
                | {
                    columns: string[];
                    rows: unknown[][];
                  };
            }[];
          }
        | {
            success: false;
            errors: { code: number; message: string }[];
          };

      const remoteCallback: Parameters<typeof drizzle>[0] = async (
        sql,
        params,
        method
      ) => {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/d1/database/${credentials.databaseId}/${
            method === 'values' ? 'raw' : 'query'
          }`,
          {
            method: 'POST',
            body: JSON.stringify({ sql, params }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${credentials.token}`,
            },
          }
        );

        const data = (await res.json()) as D1Response;

        if (!data.success) {
          throw new Error(
            data.errors.map((it) => `${it.code}: ${it.message}`).join('\n')
          );
        }

        const result = data.result[0].results;
        const rows = Array.isArray(result) ? result : result.rows;

        return {
          rows,
        };
      };

      const db = drizzle(remoteCallback);

      return { db };
    }
  }

  if (await checkPackage('@libsql/client')) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');

    const client = createClient({
      url: normalizeSQLiteUrl(credentials.url, 'libsql'),
    });
    const db = drizzle(client);

    return { db };
  }

  if (await checkPackage('better-sqlite3')) {
    const { default: Database } = await import('better-sqlite3');
    const { drizzle } = await import('drizzle-orm/better-sqlite3');

    const sqlite = new Database(
      normalizeSQLiteUrl(credentials.url, 'better-sqlite')
    );
    const db = drizzle(sqlite);

    return { db };
  }

  console.log(
    "Please install either 'better-sqlite3' or '@libsql/client' for Drizzle Kit to connect to SQLite databases"
  );
  process.exit(1);
};

export const connectToLibSQL = async (credentials: {
  url: string;
  authToken?: string;
}): Promise<SQLiteConnection> => {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');

  const client = createClient({
    url: normalizeSQLiteUrl(credentials.url, 'libsql'),
    authToken: credentials.authToken,
  });
  const db = drizzle(client);

  return { db };
};

// Alias for drizzle-kit compatibility
export const prepareSQLiteDB = connectToSQLite;
