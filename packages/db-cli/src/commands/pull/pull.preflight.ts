import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface PullOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface PullPreflightResult {
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runPullPreflight(
  options: PullOptions
): Promise<PullPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfigPath } = await resolveConfigs(options.configPath);

  return {
    drizzleConfigPath,
    chosenEnv,
  };
}