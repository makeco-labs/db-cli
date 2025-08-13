import fs from 'node:fs';
import path from 'node:path';

import type { SeedResult } from '@/dialects/result.types';
import { createRequireForTS, safeRegister } from '@/utils/compile-typescript';

/**
 * Seeds Turso database by running the seed file
 */
export async function seedTursoDatabase(seedPath: string): Promise<SeedResult> {
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

    console.log(`Loading Turso seed file: ${seedPath}`);

    // Register TypeScript loader for .ts files
    const { unregister } = await safeRegister();
    
    try {
      // Execute the seed file
      const require = createRequireForTS();
      const seedModule = require(absoluteSeedPath);

      // Look for common export patterns
      if (typeof seedModule.default === 'function') {
        await seedModule.default();
      } else if (typeof seedModule.seed === 'function') {
        await seedModule.seed();
      } else if (typeof seedModule.main === 'function') {
        await seedModule.main();
      } else {
        throw new Error(
          'Seed file must export a default function, seed function, or main function'
        );
      }

      console.log('Turso database seeded successfully');
      return {
        success: true,
        message: `Turso database seeded from ${seedPath}`,
        timestamp,
      };
    } finally {
      // Always unregister the TypeScript loader
      unregister();
    }
  } catch (error) {
    console.error('Error seeding Turso database:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during Turso seed',
      timestamp,
    };
  }
}
