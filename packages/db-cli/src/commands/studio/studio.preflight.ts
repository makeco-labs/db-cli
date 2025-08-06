import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface StudioOptions {
  config?: string;
  env?: EnvironmentKey;
}

export interface StudioPreflightResult {
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runStudioPreflight(
  options: StudioOptions
): Promise<StudioPreflightResult> {
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
