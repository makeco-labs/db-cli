import chalk from 'chalk';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import { determineEnvironment, requireConfirmation } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface ResetOptions {
  config?: string;
  env?: EnvironmentKey;
}

export interface ResetPreflightResult {
  drizzleConfig: DrizzleConfig;
  chosenEnv: EnvironmentKey;
}

export async function runResetPreflight(
  options: ResetOptions
): Promise<ResetPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfig } = await resolveConfigs(options.config);

  // Production confirmation
  await requireConfirmation({
    action: 'reset database',
    env: chosenEnv,
  });

  console.log(
    chalk.cyan(`Using drizzle config (dialect: ${drizzleConfig.dialect})`)
  );

  return {
    drizzleConfig,
    chosenEnv,
  };
}
