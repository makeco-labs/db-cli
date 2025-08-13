import chalk from 'chalk';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface SeedOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface SeedPreflightResult {
  drizzleConfig: DrizzleConfig;
  seedPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runSeedPreflight(
  options: SeedOptions
): Promise<SeedPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfig, dbConfig } = await resolveConfigs(options.configPath);

  // Validate seed path is provided
  if (!dbConfig.seed) {
    console.error(
      '❌ Error: Seed command requires a "seed" property in your db.config.ts file'
    );
    console.error('');
    console.error('Example db.config.ts:');
    console.error(`import { defineConfig } from '@makeco/db-cli';`);
    console.error('export default defineConfig({');
    console.error(`  drizzleConfig: './drizzle.config.ts',`);
    console.error(`  seed: './src/db/seed.ts'  // Add this line`);
    console.error('});');
    process.exit(1);
  }

  console.log(
    chalk.cyan(`Using drizzle config (dialect: ${drizzleConfig.dialect})`)
  );

  return {
    drizzleConfig,
    seedPath: dbConfig.seed,
    chosenEnv,
  };
}
