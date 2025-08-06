import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface DropOptions {
  config?: string;
  env?: EnvironmentKey;
}

export interface DropPreflightResult {
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runDropPreflight(
  options: DropOptions
): Promise<DropPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfigPath } = await resolveConfigs(options.config);

  return {
    drizzleConfigPath,
    chosenEnv,
  };
}
