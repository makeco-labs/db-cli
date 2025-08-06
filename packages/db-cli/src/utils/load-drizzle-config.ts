import fs from 'node:fs';
import path from 'node:path';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import { createRequireForTS, safeRegister } from './compile-typescript';

/**
 * Loads and parses a drizzle config file
 */
export async function loadDrizzleConfig(
  drizzleConfigPath: string
): Promise<DrizzleConfig> {
  try {
    const absolutePath = path.resolve(drizzleConfigPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Drizzle config file not found: ${drizzleConfigPath}`);
    }

    const { unregister } = await safeRegister();
    const require = createRequireForTS();
    const required = require(absolutePath);
    const drizzleConfig = required.default ?? required;
    unregister();

    // Validate that we have a valid drizzle config
    if (!drizzleConfig || typeof drizzleConfig !== 'object') {
      throw new Error(`Invalid drizzle config file: ${drizzleConfigPath}`);
    }
    if (!drizzleConfig.dialect) {
      throw new Error(
        `Drizzle config file missing required 'dialect' field: ${drizzleConfigPath}`
      );
    }
    return drizzleConfig;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load drizzle config file: ${drizzleConfigPath}`);
  }
}
