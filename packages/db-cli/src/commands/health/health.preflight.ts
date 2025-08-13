import type { Config as DrizzleConfig } from 'drizzle-kit';

import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface HealthOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface HealthPreflightResult {
  drizzleConfig: DrizzleConfig;
  chosenEnv: EnvironmentKey;
}

export async function runHealthPreflight(
  options: HealthOptions
): Promise<HealthPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfig } = await resolveConfigs(options.configPath);

  return {
    drizzleConfig,
    chosenEnv,
  };
}
