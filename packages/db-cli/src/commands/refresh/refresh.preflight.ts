import chalk from 'chalk';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import { determineEnvironment, requireConfirmation } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface RefreshOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface RefreshPreflightResult {
  drizzleConfig: DrizzleConfig;
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runRefreshPreflight(
  options: RefreshOptions
): Promise<RefreshPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfig, drizzleConfigPath } = await resolveConfigs(
    options.configPath
  );

  // Production confirmation for this highly destructive operation
  await requireConfirmation({
    action: 'refresh database (drop migrations, generate, reset data, migrate)',
    env: chosenEnv,
  });

  console.log(
    chalk.cyan(
      `Using drizzle config: ${drizzleConfigPath} (dialect: ${drizzleConfig.dialect})`
    )
  );

  return {
    drizzleConfig,
    drizzleConfigPath,
    chosenEnv,
  };
}
