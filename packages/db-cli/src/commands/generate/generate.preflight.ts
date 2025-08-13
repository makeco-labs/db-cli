import { resolveConfigs } from "@/utils";

export interface GenerateOptions {
	configPath?: string;
}

export interface GeneratePreflightResult {
	drizzleConfigPath: string;
}

export async function runGeneratePreflight(
	options: GenerateOptions
): Promise<GeneratePreflightResult> {
	// Resolve configs
	const { drizzleConfigPath } = await resolveConfigs(options.configPath);

	return {
		drizzleConfigPath,
	};
}
