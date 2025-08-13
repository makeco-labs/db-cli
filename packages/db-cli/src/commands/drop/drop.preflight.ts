import { resolveConfigs } from "@/utils";

export interface DropOptions {
	configPath?: string;
}

export interface DropPreflightResult {
	drizzleConfigPath: string;
}

export async function runDropPreflight(
	options: DropOptions
): Promise<DropPreflightResult> {
	// Resolve configs
	const { drizzleConfigPath } = await resolveConfigs(options.configPath);

	return {
		drizzleConfigPath,
	};
}
