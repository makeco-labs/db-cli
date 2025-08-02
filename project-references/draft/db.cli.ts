import chalk from "chalk";
import { Command, Option } from "commander";
import dotenv from "dotenv";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";

// Import necessary functions and types for seeding
import { getDbConnection } from "@infra/db/connection";
import { VALID_DIALECTS } from "@infra/db/constants";
import { serverEnvSchema } from "@lib/config/env/schemas";
import { seedDatabase } from "../setup/seed-database";
import { createPinoLogger } from "@infra/logger";

import type { CoreContext } from "@platform/context";
import type { DialectKey } from "@infra/db/types";

// ------------------ CONFIGURATION ------------------
const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(
	__filename,
	"..",
	"..",
	"..",
	"..",
	"..",
	".."
);
const dbPackagePath = path.join(projectRoot, "packages", "infra", "db");
const drizzleKitPath = path.join(
	projectRoot,
	"node_modules/drizzle-kit/bin.cjs"
);
const tsxPath = path.join(projectRoot, "node_modules/.bin/tsx"); // Use resolved path

const validActions = [
	"generate",
	"migrate",
	"studio",
	"drop",
	"push",
	// Custom
	"reset", // Wipes the DB via reset.ts
	"refresh", // Deletes migrations, generates, resets, migrates
	"seed",
] as const;
const validEnvironments = ["test", "dev", "staging", "prod"] as const;

type ActionKey = (typeof validActions)[number];
type EnvironmentKey = (typeof validEnvironments)[number];

const envMapping: Record<EnvironmentKey, string> = {
	test: "test",
	dev: "development",
	staging: "staging",
	prod: "production",
};

const dialectMapping: Record<DialectKey, string> = {
	postgres: "postgres",
	sqlite: "sqlite",
	turso: "turso",
};

const envFileNameMap: Record<EnvironmentKey, string> = {
	dev: ".env.dev",
	test: ".env.test",
	staging: ".env.staging",
	prod: ".env.prod",
};

const actionDescriptions: Record<ActionKey, string> = {
	generate: "[generate]: Generate new migrations",
	migrate: "[migrate]: Apply migrations",
	drop: "[drop]: Drop the database",
	push: "[push]: Push the database",
	reset: "[reset]: Reset the database",
	refresh: "[refresh]: Refresh the database",
	seed: "[seed]: Seed the database",
	studio: "[studio]: Open the Drizzle Studio",
};

const dialectDescriptions: Record<DialectKey, string> = {
	sqlite: "SQLite database (local development)",
	postgres: "PostgreSQL database (production/staging)",
	turso: "Turso database (production/local development)",
};

// ------------------ HELPER FUNCTIONS ------------------

// Helper function for execution
function executeCommand(input: {
	dialect: DialectKey | undefined;
	env: EnvironmentKey | undefined;
	command: string;
	stepName?: string; // Optional name for better logging
}) {
	const { dialect, env, command, stepName } = input;
	const stepLabel = stepName ? ` [${stepName}]` : "";
	console.log(
		chalk.blue(`\nExecuting${stepLabel} (${dialect}/${env}): ${command}`)
	);
	try {
		// Use the resolved tsxPath here
		execSync(command, { stdio: "inherit", cwd: projectRoot, env: process.env });
		console.log(chalk.green(`Command${stepLabel} completed successfully.`));
	} catch (error: any) {
		console.error(chalk.red(`\nCommand${stepLabel} failed!`));
		throw error; // Re-throw to be caught by the caller
	}
}

// --- Command Generation Helpers ---

function getEnvPrefix(env: EnvironmentKey | undefined): string {
	if (!env) return ""; // Or handle error/default
	const envFileName = envFileNameMap[env];
	const specificEnvPath = path.join(projectRoot, envFileName);
	// Check if file exists for better feedback (optional)
	if (!fs.existsSync(specificEnvPath)) {
		console.warn(
			chalk.yellow(
				`[Warning] Env file for command prefix not found: ${specificEnvPath}`
			)
		);
	}
	// Ensure correct quoting if path contains spaces, though unlikely for .env files
	return `dotenv -e "${specificEnvPath}" --`;
}

function getDrizzleKitCommand(input: {
	action: "generate" | "migrate" | "drop" | "push";
	configFilePath: string;
	envPrefix: string;
}): string {
	const { action, configFilePath, envPrefix } = input;
	return `${envPrefix} ${tsxPath} ${drizzleKitPath} ${action} --config="${configFilePath}"`;
}

function getStudioCommand(input: {
	configFilePath: string;
	envPrefix: string;
}): string {
	const { configFilePath, envPrefix } = input;
	return `${envPrefix} ${tsxPath} ${drizzleKitPath} studio --verbose --config="${configFilePath}"`;
}

function getResetCommand(input: {
	resetScriptPath: string;
	envPrefix: string;
}): string {
	const { resetScriptPath, envPrefix } = input;
	return `${envPrefix} ${tsxPath} "${resetScriptPath}"`;
}

// async function seedDatabaseCommand(): Promise<void> {
// 	console.log("Seeding database");
// 	console.log("Creating context...");
// 	const ctx = await createContext();
// 	console.log("Seeding database...");
// await seedDatabase(ctx);
// console.log("Database seeded successfully!");
// }

// --- Selection Helper Functions ---

/**
 * Determines the action to be performed, either from input or via interactive prompt
 */
async function determineAction(
	actionInput: ActionKey | undefined
): Promise<ActionKey> {
	let chosenAction: ActionKey;

	if (actionInput && validActions.includes(actionInput as ActionKey)) {
		chosenAction = actionInput as ActionKey;
	} else {
		if (actionInput) {
			console.log(
				chalk.yellow(`Invalid action specified: "${actionInput}". Prompting...`)
			);
		}
		try {
			const response = await prompts({
				type: "select",
				name: "value",
				message: chalk.blue("Select the action to perform:"),
				choices: validActions.map(act => ({
					title: actionDescriptions[act],
					value: act,
				})),
				initial: 0, // Default selection highlight
			});
			if (!response.value) {
				console.log(chalk.red("\nOperation canceled."));
				process.exit(0);
			}
			chosenAction = response.value;
			console.log(
				chalk.green(`Action selected via prompt: ${chalk.bold(chosenAction)}`)
			);
		} catch (error) {
			console.error(chalk.red("Error during action prompt:"), error);
			process.exit(1);
		}
	}

	return chosenAction;
}

/**
 * Determines the dialect to be used, either from input or via interactive prompt
 */
async function determineDialect(
	dialectInput: DialectKey | undefined
): Promise<DialectKey> {
	let chosenDialect: DialectKey;

	if (dialectInput && VALID_DIALECTS.includes(dialectInput as DialectKey)) {
		chosenDialect = dialectInput;
		// console.log(
		// 	chalk.green(`Dialect specified via flag: ${chalk.bold(chosenDialect)}`)
		// );
	} else {
		if (dialectInput) {
			console.log(
				chalk.yellow(
					`Invalid dialect specified: "${dialectInput}". Prompting...`
				)
			);
		}
		try {
			const response = await prompts({
				type: "select",
				name: "value",
				message: chalk.blue("Select the target dialect:"),
				choices: VALID_DIALECTS.map(dialect => ({
					title: dialectDescriptions[dialect],
					value: dialect,
				})),
			});
			if (!response.value) {
				console.log(chalk.red("\nOperation canceled."));
				process.exit(0);
			}
			chosenDialect = response.value;
			console.log(
				chalk.green(`Dialect selected via prompt: ${chalk.bold(chosenDialect)}`)
			);
		} catch (error) {
			console.error(chalk.red("Error during dialect prompt:"), error);
			process.exit(1);
		}
	}

	return chosenDialect;
}

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
async function determineEnvironment(
	envInput: EnvironmentKey | undefined
): Promise<EnvironmentKey> {
	let chosenEnv: EnvironmentKey;

	if (envInput && validEnvironments.includes(envInput)) {
		chosenEnv = envInput;
	} else {
		try {
			const response = await prompts({
				type: "select",
				name: "value",
				message: chalk.blue("Select the target environment:"),
				choices: [
					{
						title: "Test Environment",
						value: "test" as EnvironmentKey,
					},
					{
						title: "Development Server",
						value: "dev" as EnvironmentKey,
					},
					{
						title: "Staging Environment",
						value: "staging" as EnvironmentKey,
					},
					{
						title: "Production Environment",
						value: "production" as EnvironmentKey,
					},
				],
			});
			if (!response.value) {
				console.log(chalk.red("\nOperation canceled."));
				process.exit(0);
			}
			chosenEnv = response.value;
			console.log(
				chalk.green(`Environment selected via prompt: ${chalk.bold(chosenEnv)}`)
			);
		} catch (error) {
			console.error(chalk.red("Error during environment prompt:"), error);
			process.exit(1);
		}
	}

	return chosenEnv;
}

/**
 * Sets up the environment variables based on the chosen environment
 */
function setupEnvironment(chosenEnv: EnvironmentKey): void {
	// Set NODE_ENV before loading .env files
	const targetNodeEnv = envMapping[chosenEnv] || "development";
	process.env.NODE_ENV = targetNodeEnv;
	// console.log(
	// 	chalk.cyan(
	// 		`[DEBUG] Initial process.env.NODE_ENV set to: ${chalk.bold(targetNodeEnv)}`
	// 	)
	// );

	// Determine the specific .env file path
	const envFileName = envFileNameMap[chosenEnv];
	const specificEnvPath = path.join(projectRoot, envFileName);
	const relativeEnvPath = path.relative(projectRoot, specificEnvPath);

	// Check if the .env file exists and load it
	if (!fs.existsSync(specificEnvPath)) {
		console.warn(
			chalk.yellow(
				`[DEBUG] Warning: Target environment file NOT FOUND at "${relativeEnvPath}".`
			)
		);
	} else {
		// console.log(
		// 	chalk.blue(
		// 		`[DEBUG] Target environment file FOUND. Loading from: ${chalk.bold(specificEnvPath)}`
		// 	)
		// );
		dotenv.config({
			path: specificEnvPath,
			override: true,
		});
	}
}

/**
 * Creates a context object with specified dependencies
 */
async function createContext(dialect: DialectKey): Promise<CoreContext> {
	const env = serverEnvSchema.parse(process.env);
	console.log("Getting db connection for dialect", dialect);
	console.log({
		POSTGRES_DATABASE_URL: env.POSTGRES_DATABASE_URL,
		NODE_ENV: env.NODE_ENV,
	});
	const db = await getDbConnection(dialect as any, env);

	console.log("Got db connection for dialect", dialect);

	// const version = await db.execute(sql`SELECT version() AS VERSION`);
	// console.log("version", version);

	return {
		logger: createPinoLogger(env),
		env,
		db,
	};
}

/**
 * Prompts user for confirmation when performing dangerous operations in production
 */
async function confirmProductionOperation(
	action: string,
	env: EnvironmentKey
): Promise<boolean> {
	if (env !== "prod") {
		return true; // No confirmation needed for non-production environments
	}

	console.log(
		chalk.red.bold(
			`\n⚠️  WARNING: You are about to perform a ${action.toUpperCase()} operation on PRODUCTION!`
		)
	);
	console.log(
		chalk.yellow(
			"This operation is destructive and will affect the production database."
		)
	);

	try {
		const response = await prompts({
			type: "confirm",
			name: "value",
			message: chalk.red(
				`Are you absolutely sure you want to ${action} the PRODUCTION database?`
			),
			initial: false, // Default to "No" for safety
		});

		if (!response.value) {
			console.log(chalk.yellow("\nOperation canceled for safety."));
			return false;
		}

		// Double confirmation for extra safety
		const doubleConfirm = await prompts({
			type: "confirm",
			name: "value",
			message: chalk.red.bold(
				"This is your final confirmation. Proceed with PRODUCTION operation?"
			),
			initial: false,
		});

		if (!doubleConfirm.value) {
			console.log(chalk.yellow("\nOperation canceled for safety."));
			return false;
		}

		return true;
	} catch (error) {
		console.error(chalk.red("Error during confirmation prompt:"), error);
		return false;
	}
}

// ------------------ SETUP COMMANDER ------------------
const program = new Command()
	.name("db-actions")
	.description("CLI helper for running Drizzle Kit and custom DB scripts")
	.version("1.0.0");

program
	.name("db") // How the command might be invoked via bin linking
	.description(
		chalk.blue(
			"Wrapper script for Drizzle Kit actions with interactive prompts."
		)
	)
	// Use an optional argument for the action instead of a subcommand
	.argument("[action]", "Action to perform (e.g., migrate, generate, seed)")
	.addOption(
		new Option(
			"-d, --dialect <name>", // Optional flag for dialect
			"Specify the target dialect (sqlite, postgres, turso)"
		).choices(VALID_DIALECTS)
	)
	.addOption(
		new Option(
			"-e, --env <name>", // Optional flag for environment
			"Specify the target environment (local, test, dev, staging)"
		).choices(validEnvironments) // Validate flag input if provided
	)
	.action(handleAction); // Define the main handler function

program.addHelpText(
	"after",
	`
  Examples:
    bun run db generate -d sqlite -e test
    bun run db migrate -e staging
    bun run db studio -e dev
    bun run db seed -d sqlite -e test
    bun run db reset -e prod
  `
);

// ------------------ ACTION HANDLER ------------------
async function handleAction(
	actionInput: ActionKey | undefined,
	options: { env?: EnvironmentKey; dialect?: DialectKey }
) {
	// Determine inputs using the extracted helper functions
	const chosenAction = await determineAction(actionInput);
	const chosenDialect = await determineDialect(options.dialect);
	const chosenEnv = await determineEnvironment(options.env);

	// Setup environment using the extracted helper function
	setupEnvironment(chosenEnv);

	// --- Shared Path/Config Calculation ---
	const dialectFileName = dialectMapping[chosenDialect];
	const configFileName = `drizzle.config.${dialectFileName}.ts`;
	const configFilePath = path.join(dbPackagePath, configFileName);
	const resetScriptPath = path.join(
		dbPackagePath,
		`dist/src/${dialectFileName}/scripts/reset.js` // Using dist folder now since it resolves path aliases
	);
	const migrationsFolderPath = path.join(
		dbPackagePath, // Base path for migrations
		"src",
		dialectFileName, // Subfolder per dialect (adjust if different)
		"migrations" // Your top-level migrations folder
	);
	const envPrefix = getEnvPrefix(chosenEnv); // Get the dotenv prefix once

	// --- Command Execution Logic ---
	let commandToExecute: string | null = null;

	try {
		switch (chosenAction) {
			case "generate":
			case "drop":
			case "migrate":
			case "push":
				commandToExecute = getDrizzleKitCommand({
					action: chosenAction,
					configFilePath,
					envPrefix,
				});
				break;

			case "studio":
				commandToExecute = getStudioCommand({ configFilePath, envPrefix });
				break;

			case "reset":
				// Check for production confirmation
				if (chosenEnv === "prod") {
					const confirmed = await confirmProductionOperation(
						"reset",
						chosenEnv
					);
					if (!confirmed) {
						process.exit(0);
					}
				}
				commandToExecute = getResetCommand({ resetScriptPath, envPrefix });
				break;

			case "refresh": {
				// Check for production confirmation
				if (chosenEnv === "prod") {
					const confirmed = await confirmProductionOperation(
						"refresh",
						chosenEnv
					);
					if (!confirmed) {
						process.exit(0);
					}
				}

				// Step 1: Delete old migrations (Still needs direct fs access)
				console.log(
					chalk.blue(
						`\n[Refresh Step 1] Deleting migration files in: ${migrationsFolderPath}`
					)
				);
				if (fs.existsSync(migrationsFolderPath)) {
					const deleteCommand = getDrizzleKitCommand({
						action: "drop",
						configFilePath,
						envPrefix,
					});
					executeCommand({
						dialect: chosenDialect,
						env: chosenEnv,
						command: deleteCommand,
						stepName: "Refresh Step 1: Delete Migrations",
					});
					console.log(chalk.green("Migrations deleted successfully."));
				} else {
					console.log(
						chalk.yellow("Migration folder not found, skipping deletion.")
					);
				}

				// Step 2: Generate new migrations (using helper)
				const generateCommand = getDrizzleKitCommand({
					action: "generate",
					configFilePath,
					envPrefix,
				});
				executeCommand({
					dialect: chosenDialect,
					env: chosenEnv,
					command: generateCommand,
					stepName: "Refresh Step 2: Generate Migrations",
				});

				// Step 3: Reset the database (using helper)
				const resetCommand = getResetCommand({ resetScriptPath, envPrefix });
				executeCommand({
					dialect: chosenDialect,
					env: chosenEnv,
					command: resetCommand,
					stepName: "Refresh Step 3: Reset Database",
				});

				// Step 4: Apply new migrations (using helper)
				const migrateCommand = getDrizzleKitCommand({
					action: "migrate",
					configFilePath,
					envPrefix,
				});
				executeCommand({
					dialect: chosenDialect,
					env: chosenEnv,
					command: migrateCommand,
					stepName: "Refresh Step 4: Apply Migrations",
				});

				console.log(chalk.green.bold("\n✅ Database refreshed successfully!"));
				process.exit(0); // Success for refresh sequence
				break; // End of refresh case
			}

			case "seed":
				try {
					if (chosenEnv === "prod") {
						// Add safety check for production
						console.log(
							chalk.red("❌ ERROR: Seeding production database is disabled.")
						);
						process.exit(1);
					}

					console.log(
						chalk.blue(
							`\nSeeding database for dialect: ${chosenDialect}, environment: ${chosenEnv}`
						)
					);

					// Create context for database operations
					const ctx = await createContext(chosenDialect);

					// Execute the seed operation
					await seedDatabase(ctx);

					console.log(chalk.green.bold("\n✅ Database seeded successfully!"));
					process.exit(0);
				} catch (error) {
					console.error(chalk.red(`\n❌ Database seeding failed:`), error);
					process.exit(1);
				}
				break;

			default:
				// Should be caught by initial validation, but good practice
				console.error(
					chalk.red(`Internal error: Unhandled action '${chosenAction}'`)
				);
				process.exit(1);
		}

		// Execute the single command determined by the switch
		if (commandToExecute) {
			executeCommand({
				dialect: chosenDialect,
				env: chosenEnv,
				command: commandToExecute,
			});
		} else if (chosenAction && !["refresh", "seed"].includes(chosenAction)) {
			// Fixed linter error by changing the comparison approach
			console.error(
				chalk.red(
					`Internal error: No command generated for action '${chosenAction}'.`
				)
			);
			process.exit(1);
		}
	} catch (error) {
		// Catch errors from executeCommand or prompts
		console.error(
			chalk.red(`\n❌ Operation failed during action: ${chosenAction}`)
		);
		// Error details should have been printed by executeCommand or the prompt handler
		process.exit(1);
	}
}

// ------------------ EXECUTE COMMANDER ------------------
program.parseAsync(process.argv).catch(error => {
	console.error(
		chalk.red("An unexpected error occurred outside the main action handler:"),
		error
	);
	process.exit(1);
});
