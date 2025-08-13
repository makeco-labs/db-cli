import fs from 'node:fs';
import path from 'node:path';
import type { SeedResult } from '@/dialects/result.types';
import { createRequireForTS, safeRegister } from '@/utils/compile-typescript';

/**
 * Seeds a SQLite database by executing a seed file
 */
export async function seedSQLiteDatabase(
  seedPath: string
): Promise<SeedResult> {
  const timestamp = new Date().toISOString();

  try {
    // Validate seed file exists
    const absoluteSeedPath = path.resolve(seedPath);
    if (!fs.existsSync(absoluteSeedPath)) {
      return {
        success: false,
        error: `Seed file not found: ${seedPath}`,
        timestamp,
      };
    }

    // Register TypeScript loader for .ts files
    const { unregister } = await safeRegister();
    
    try {
      // Execute the seed file
      // The seed file should export a default function that handles its own connection
      const require = createRequireForTS();
      const seedModule = require(absoluteSeedPath);
      const seedFunction = seedModule.default || seedModule.seed;

      if (typeof seedFunction !== 'function') {
        return {
          success: false,
          error: `Seed file must export a default function or named 'seed' function: ${seedPath}`,
          timestamp,
        };
      }

      // Execute the seed function (zero abstraction - no parameters)
      await seedFunction();

      return {
        success: true,
        message: `Database seeded successfully from ${seedPath}`,
        timestamp,
      };
    } finally {
      // Always unregister the TypeScript loader
      unregister();
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during SQLite seed',
      timestamp,
    };
  }
}
