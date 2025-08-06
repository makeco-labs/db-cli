import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface GenerateOptions {
  config?: string;
  env?: EnvironmentKey;
}

export interface GeneratePreflightResult {
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runGeneratePreflight(
  options: GenerateOptions
): Promise<GeneratePreflightResult> {
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
