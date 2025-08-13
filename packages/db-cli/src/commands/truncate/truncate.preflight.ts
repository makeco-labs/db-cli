import chalk from 'chalk';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface TruncateOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface TruncatePreflightResult {
  drizzleConfig: DrizzleConfig;
  chosenEnv: EnvironmentKey;
}

export async function runTruncatePreflight(
  options: TruncateOptions
): Promise<TruncatePreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfig } = await resolveConfigs(options.configPath);

  console.log(
    chalk.cyan(`Using drizzle config (dialect: ${drizzleConfig.dialect})`)
  );

  return {
    drizzleConfig,
    chosenEnv,
  };
}
