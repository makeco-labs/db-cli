import fs from 'node:fs';
import path from 'node:path';
import type { DbConfig } from '@/definitions';

import { createRequireForTS, safeRegister } from './compile-typescript';
import { discoverDbConfig } from './discover-config';
import { loadDrizzleConfig } from './load-drizzle-config';

/**
 * Loads and parses a db config file
 */
export async function loadDbConfig(dbConfigPath: string): Promise<DbConfig> {
  try {
    const absolutePath = path.resolve(dbConfigPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`DB config file not found: ${dbConfigPath}`);
    }

    const { unregister } = await safeRegister();
    const require = createRequireForTS();
    const required = require(absolutePath);
    const dbConfig = required.default ?? required;
    unregister();

    // Validate that we have a valid db config
    if (!dbConfig || typeof dbConfig !== 'object') {
      throw new Error(`Invalid DB config file: ${dbConfigPath}`);
    }
    if (!dbConfig.drizzleConfig) {
      throw new Error(
        `DB config file missing required 'drizzleConfig' field: ${dbConfigPath}`
      );
    }
    return dbConfig;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load DB config file: ${dbConfigPath}`);
  }
}

/**
 * Resolves db.config.ts and its referenced drizzle config
 * Always requires a db.config.ts file with a drizzleConfig property
 */
export async function resolveConfigs(dbConfigPath?: string): Promise<{
  drizzleConfig: any;
  dbConfig: DbConfig;
  drizzleConfigPath: string;
}> {
  // Determine db config path
  let resolvedDbConfigPath: string;

  if (dbConfigPath) {
    // User provided a specific db config path
    resolvedDbConfigPath = dbConfigPath;
  } else {
    // Auto-discovery: look for db.config files
    const discoveredDbConfig = discoverDbConfig();
    if (!discoveredDbConfig) {
      console.error('❌ Error: No db.config.ts file found.');
      console.error(
        'Expected files: db.config.ts, db.config.js, db.config.mjs, or db.config.cjs'
      );
      console.error('Or specify a config file with --config flag');
      console.error('');
      console.error('Example db.config.ts:');
      console.error(`import { defineConfig } from '@makeco/db-cli';`);
      console.error('export default defineConfig({');
      console.error(`  drizzleConfig: './drizzle.config.ts',`);
      console.error(
        `  seed: './src/db/seed.ts'  // Optional: only needed for seed command`
      );
      console.error('});');
      process.exit(1);
    }
    resolvedDbConfigPath = discoveredDbConfig;
  }

  // Load the db config
  const dbConfig = await loadDbConfig(resolvedDbConfigPath);

  // Resolve the drizzle config path from db config
  const drizzleConfigPath = path.resolve(dbConfig.drizzleConfig);

  // Load the drizzle config
  const drizzleConfig = await loadDrizzleConfig(drizzleConfigPath);

  return {
    drizzleConfig,
    dbConfig,
    drizzleConfigPath,
  };
}
