import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import z, { object, string, type TypeOf } from 'zod';
import { checkPackage } from '../../utils';

// ========================================================================
// TYPES
// ========================================================================

export interface TursoConnection {
  db: LibSQLDatabase<Record<string, never>>;
}

// Turso credentials type
export const tursoCredentials = object({
  url: string().min(1),
  authToken: string().min(1).optional(),
});

export type TursoCredentials = TypeOf<typeof tursoCredentials>;

// ========================================================================
// CONNECTION FUNCTIONS
// ========================================================================

/**
 * Prepares a Turso database connection using @libsql/client
 */
export async function prepareTursoDB(
  credentials: TursoCredentials
): Promise<TursoConnection> {
  if (await checkPackage('@libsql/client')) {
    console.log(`Using '@libsql/client' driver for Turso database querying`);
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');

    const client = createClient({
      url: credentials.url,
      authToken: credentials.authToken,
    });

    const db = drizzle(client);
    return { db };
  }

  throw new Error(
    "Please install '@libsql/client' for Drizzle Kit to connect to Turso databases"
  );
}
