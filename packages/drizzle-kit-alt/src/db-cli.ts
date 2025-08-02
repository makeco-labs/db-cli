#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import prompts from 'prompts';

// Import drizzle-kit types
import type { Config } from 'drizzle-kit';

// Import database reset functionality
import { resetDatabase } from './reset';

// Import database connection check functionality
import { checkConnection } from './check';

// Types for supported commands
type DrizzleKitCommand = 'generate' | 'migrate' | 'studio' | 'drop' | 'push';
type ActionKey = DrizzleKitCommand | 'reset' | 'refresh' | 'check';
type EnvironmentKey = 'dev' | 'test' | 'staging' | 'prod';

const validEnvironments: EnvironmentKey[] = ['dev', 'test', 'staging', 'prod'];
const validActions: ActionKey[] = ['generate', 'migrate', 'studio', 'drop', 'push', 'reset', 'refresh', 'check'];

const actionDescriptions: Record<ActionKey, string> = {
  generate: '[generate]: Generate new migrations',
  migrate: '[migrate]: Apply migrations',
  studio: '[studio]: Open Drizzle Studio',
  drop: '[drop]: Drop migrations folder',
  push: '[push]: Push schema changes',
  reset: '[reset]: Reset database data',
  refresh: '[refresh]: Refresh database (drop + generate + reset + migrate)',
  check: '[check]: Check database connection',
};

// Updated workflow definitions - drop vs reset distinction
const WORKFLOWS = {
  reset: ['reset', 'migrate'] as const,          // Clear database data, then migrate
  refresh: ['drop', 'generate', 'reset', 'migrate'] as const, // Drop migrations, generate, clear data, migrate
} as const;

/**
 * Discovers drizzle config file in the current working directory
 * Follows drizzle-kit's config discovery logic
 */
function discoverDrizzleConfig(): string | null {
  const configPatterns = [
    'drizzle.config.ts',
    'drizzle.config.js',
    'drizzle.config.mjs',
    'drizzle.config.cjs',
  ];

  const cwd = process.cwd();
  
  for (const pattern of configPatterns) {
    const configPath = path.join(cwd, pattern);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Determines the environment to be used, either from input or via interactive prompt
 * Environment is now required - will always prompt if not provided
 */
async function determineEnvironment(envInput?: string): Promise<string> {
  if (envInput && validEnvironments.includes(envInput as EnvironmentKey)) {
    return envInput;
  }
  
  if (envInput) {
    console.log(chalk.yellow(`Invalid environment specified: "${envInput}". Prompting...`));
  }
  
  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.blue('Select the target environment (required):'),
      choices: [
        { title: 'Development', value: 'dev' },
        { title: 'Test Environment', value: 'test' },
        { title: 'Staging Environment', value: 'staging' },
        { title: 'Production Environment', value: 'prod' },
      ],
      initial: 1, // Default to 'test' for development
    });
    
    if (!response.value) {
      console.log(chalk.red('\nEnvironment selection is required. Operation canceled.'));
      process.exit(0);
    }
    
    console.log(chalk.green(`Environment selected: ${chalk.bold(response.value)}`));
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during environment prompt:'), error);
    process.exit(1);
  }
}

/**
 * Determines the action to be performed, either from input or via interactive prompt
 */
async function determineAction(actionInput?: string): Promise<ActionKey> {
  if (actionInput && validActions.includes(actionInput as ActionKey)) {
    return actionInput as ActionKey;
  }
  
  if (actionInput) {
    console.log(chalk.yellow(`Invalid action specified: "${actionInput}". Prompting...`));
  }
  
  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.blue('Select the action to perform:'),
      choices: validActions.map(action => ({
        title: actionDescriptions[action],
        value: action,
      })),
      initial: 0,
    });
    
    if (!response.value) {
      console.log(chalk.red('\nOperation canceled.'));
      process.exit(0);
    }
    
    console.log(chalk.green(`Action selected: ${chalk.bold(response.value)}`));
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during action prompt:'), error);
    process.exit(1);
  }
}

/**
 * Loads environment variables from .env file (required)
 */
function loadEnvironment(envName: string): void {
  const envFile = `.env.${envName}`;
  const envPath = path.resolve(envFile);
  
  if (fs.existsSync(envPath)) {
    console.log(chalk.blue(`Loading environment from: ${envFile}`));
    dotenv.config({ path: envPath, override: true });
  } else {
    console.warn(chalk.yellow(`⚠️  Warning: Environment file not found: ${envFile}`));
    console.log(chalk.gray(`Expected file: ${envPath}`));
  }
}

/**
 * Loads and parses the drizzle config file
 */
async function loadConfig(configPath: string): Promise<Config> {
  try {
    const absolutePath = path.resolve(configPath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    let config: Config;

    if (absolutePath.endsWith('.ts')) {
      // For TypeScript files, we need to use tsx to execute them
      try {
        const result = execSync(`npx tsx -e "
          const config = require('${absolutePath}');
          console.log(JSON.stringify(config.default || config));
        "`, { encoding: 'utf8' });
        config = JSON.parse(result.trim());
      } catch {
        throw new Error(`Failed to load TypeScript config file: ${configPath}`);
      }
    } else {
      // For JS files, use dynamic import
      const fileUrl = pathToFileURL(absolutePath).href;
      const module = await import(fileUrl);
      config = module.default || module;
    }

    // Validate that we have a valid config
    if (!config || typeof config !== 'object') {
      throw new Error(`Invalid config file: ${configPath}`);
    }

    if (!config.dialect) {
      throw new Error(`Config file missing required 'dialect' field: ${configPath}`);
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }
    throw new Error(`Failed to load config from ${configPath}`);
  }
}

/**
 * Validates that drizzle-kit is available in the project
 */
function validateDrizzleKit(): void {
  try {
    execSync('npx drizzle-kit --version', { stdio: 'pipe' });
  } catch {
    console.error('❌ Error: drizzle-kit not found. Please install drizzle-kit as a dependency.');
    process.exit(1);
  }
}

/**
 * Validates drizzle config file exists and is accessible
 */
function validateConfigPath(configPath: string | null): string {
  if (!configPath) {
    console.error('❌ Error: No drizzle config file found.');
    console.error('Expected files: drizzle.config.ts, drizzle.config.js, drizzle.config.mjs, or drizzle.config.cjs');
    console.error('Or specify a config file with --config flag');
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Error: Config file not found: ${configPath}`);
    process.exit(1);
  }

  return configPath;
}

/**
 * Executes a drizzle-kit command
 */
function executeCommand(command: string, configPath: string): void {
  const fullCommand = `npx drizzle-kit ${command} --config="${configPath}"`;
  
  console.log(`Executing: ${fullCommand}`);
  
  try {
    execSync(fullCommand, { stdio: 'inherit' });
  } catch {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

/**
 * Executes database reset (clears data)
 */
async function executeReset(config: Config): Promise<void> {
  console.log('\n📋 Resetting database data...');
  
  try {
    const result = await resetDatabase(config);
    
    if (result.success) {
      console.log(`✅ Database reset completed successfully!`);
      if (result.tablesDropped.length > 0) {
        console.log(`Dropped ${result.tablesDropped.length} tables/schemas:`, result.tablesDropped.join(', '));
      }
    } else {
      throw new Error(result.error || 'Database reset failed');
    }
  } catch (error) {
    console.error('❌ Database reset failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Executes database connection check
 */
async function executeCheck(config: Config): Promise<void> {
  console.log('\n🔍 Checking database connection...');
  
  try {
    const result = await checkConnection(config);
    
    if (result.status === 'ok') {
      console.log(`✅ Database connection successful!`);
      if (result.version) {
        console.log(`Database version: ${result.version}`);
      }
      console.log(`Status: ${result.status} at ${result.timestamp}`);
    } else {
      throw new Error(result.message || 'Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Executes a workflow (sequence of commands)
 */
async function executeWorkflow(workflow: readonly string[], configPath: string, config: Config): Promise<void> {
  console.log(`Executing workflow: ${workflow.join(' → ')}`);
  
  for (const step of workflow) {
    console.log(`\n📋 Step: ${step}`);
    
    if (step === 'reset') {
      await executeReset(config);
    } else {
      executeCommand(step, configPath);
    }
  }
  
  console.log('\n✅ Workflow completed successfully!');
}

/**
 * Prompts for confirmation in production environment
 */
async function requireProductionConfirmation(action: string, config: Config): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return;
  }

  console.log(`\n⚠️  WARNING: You are about to perform a ${action.toUpperCase()} operation in PRODUCTION!`);
  console.log('This operation is destructive and will affect the production database.');
  console.log(`Database: ${config.dialect}`);
  
  // For now, we'll exit in production for safety
  // In a real implementation, you might want to add an interactive prompt
  console.log('❌ Operation canceled for safety in production environment.');
  console.log('Use NODE_ENV=development to bypass this check in non-production environments.');
  process.exit(1);
}

// Create the CLI program
const program = new Command();

program
  .name('drizzle-kit-alt')
  .description('A higher-level abstraction over drizzle-kit with additional database management commands')
  .version('0.1.0')
  .argument('[action]', 'Action to perform (generate, migrate, studio, etc.)')
  .action(async (action, options) => {
    // Interactive mode when no action is provided or invalid action
    const chosenAction = await determineAction(action);
    const chosenEnv = await determineEnvironment(options.env);
    
    // Load environment variables
    loadEnvironment(chosenEnv);
    
    // Get config path
    const configPath = options.config || discoverDrizzleConfig();
    const validatedConfigPath = validateConfigPath(configPath);
    
    // Load and validate config
    const config = await loadConfig(validatedConfigPath);
    console.log(chalk.cyan(`Using config: ${validatedConfigPath} (dialect: ${config.dialect})`));
    
    // Execute the chosen action
    await executeAction(chosenAction, validatedConfigPath, config);
  });

// Add global config and environment options
program.option('-c, --config <path>', 'Path to drizzle config file');
program.option('-e, --env <name>', 'Environment to load (.env.{name})');

// Add standard drizzle-kit commands
const drizzleCommands: DrizzleKitCommand[] = ['generate', 'migrate', 'studio', 'drop', 'push'];

drizzleCommands.forEach(command => {
  program
    .command(command)
    .description(`${command.charAt(0).toUpperCase() + command.slice(1)} (passes through to drizzle-kit)`)
    .option('-c, --config <path>', 'Path to drizzle config file')
    .option('-e, --env <name>', 'Environment to load (.env.{name})')
    .action(async (options, cmd) => {
      // Determine environment (required)
      const envName = options.env || cmd.parent?.opts().env;
      const chosenEnv = await determineEnvironment(envName);
      loadEnvironment(chosenEnv);
      
      // Get config from command option or global option
      const configPath = options.config || cmd.parent?.opts().config || discoverDrizzleConfig();
      const validatedConfigPath = validateConfigPath(configPath);
      
      validateDrizzleKit();
      
      // Load and validate config
      const config = await loadConfig(validatedConfigPath);
      console.log(chalk.cyan(`Using config: ${validatedConfigPath} (dialect: ${config.dialect})`));
      
      executeCommand(command, validatedConfigPath);
    });
});

// Add custom reset command
program
  .command('reset')
  .description('Reset database data (clears all user tables, then runs migrations)')
  .option('-c, --config <path>', 'Path to drizzle config file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options, cmd) => {
    // Determine environment (required)
    const envName = options.env || cmd.parent?.opts().env;
    const chosenEnv = await determineEnvironment(envName);
    loadEnvironment(chosenEnv);
    
    // Get config from command option or global option
    const configPath = options.config || cmd.parent?.opts().config || discoverDrizzleConfig();
    const validatedConfigPath = validateConfigPath(configPath);
    
    validateDrizzleKit();
    
    // Load and validate config
    const config = await loadConfig(validatedConfigPath);
    console.log(chalk.cyan(`Using config: ${validatedConfigPath} (dialect: ${config.dialect})`));
    
    await requireProductionConfirmation('reset', config);
    await executeWorkflow(WORKFLOWS.reset, validatedConfigPath, config);
  });

// Add custom refresh command  
program
  .command('refresh')
  .description('Refresh database (drop migrations + generate + reset data + migrate)')
  .option('-c, --config <path>', 'Path to drizzle config file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options, cmd) => {
    // Determine environment (required)
    const envName = options.env || cmd.parent?.opts().env;
    const chosenEnv = await determineEnvironment(envName);
    loadEnvironment(chosenEnv);
    
    // Get config from command option or global option
    const configPath = options.config || cmd.parent?.opts().config || discoverDrizzleConfig();
    const validatedConfigPath = validateConfigPath(configPath);
    
    validateDrizzleKit();
    
    // Load and validate config
    const config = await loadConfig(validatedConfigPath);
    console.log(chalk.cyan(`Using config: ${validatedConfigPath} (dialect: ${config.dialect})`));
    
    await requireProductionConfirmation('refresh', config);
    await executeWorkflow(WORKFLOWS.refresh, validatedConfigPath, config);
  });

// Add custom check command
program
  .command('check')
  .description('Check database connection and health')
  .option('-c, --config <path>', 'Path to drizzle config file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options, cmd) => {
    // Determine environment (required)
    const envName = options.env || cmd.parent?.opts().env;
    const chosenEnv = await determineEnvironment(envName);
    loadEnvironment(chosenEnv);
    
    // Get config from command option or global option
    const configPath = options.config || cmd.parent?.opts().config || discoverDrizzleConfig();
    const validatedConfigPath = validateConfigPath(configPath);
    
    // Load and validate config
    const config = await loadConfig(validatedConfigPath);
    console.log(chalk.cyan(`Using config: ${validatedConfigPath} (dialect: ${config.dialect})`));
    
    await executeCheck(config);
  });

// Add help examples
program.addHelpText('after', `

Examples:
  $ drizzle-kit-alt generate              # Generate migrations
  $ drizzle-kit-alt migrate               # Run migrations
  $ drizzle-kit-alt studio                # Launch Drizzle Studio
  $ drizzle-kit-alt drop                  # Drop migrations folder (drizzle-kit)
  $ drizzle-kit-alt check                 # Check database connection and health
  $ drizzle-kit-alt reset                 # Clear database data + migrate
  $ drizzle-kit-alt refresh               # Drop migrations + generate + clear data + migrate
  $ drizzle-kit-alt generate --config ./custom.config.ts  # Use custom config
  $ drizzle-kit-alt -c ./my-config.ts migrate             # Use global config flag
  $ drizzle-kit-alt reset -e test                         # Load .env.test file
  $ drizzle-kit-alt migrate -e prod                       # Load .env.prod file

Commands:
  drop     - Drops migrations folder (drizzle-kit default behavior)
  check    - Checks database connection and displays version information
  reset    - Clears database data, then runs migrations
  refresh  - Complete refresh: drop migrations → generate → clear data → migrate

Environment:
  Set NODE_ENV=production to enable production safety checks.

Config Discovery:
  The CLI will automatically discover drizzle config files in this order:
  1. --config/-c flag value
  2. drizzle.config.ts
  3. drizzle.config.js
  4. drizzle.config.mjs
  5. drizzle.config.cjs
`);

/**
 * Execute the chosen action
 */
async function executeAction(action: ActionKey, configPath: string, config: Config): Promise<void> {
  switch (action) {
    case 'generate':
    case 'migrate':
    case 'studio':
    case 'drop':
    case 'push':
      if (action !== 'studio') {
        validateDrizzleKit();
      }
      executeCommand(action, configPath);
      break;
      
    case 'check':
      await executeCheck(config);
      break;
      
    case 'reset':
      validateDrizzleKit();
      await requireProductionConfirmation('reset', config);
      await executeWorkflow(WORKFLOWS.reset, configPath, config);
      break;
      
    case 'refresh':
      validateDrizzleKit();
      await requireProductionConfirmation('refresh', config);
      await executeWorkflow(WORKFLOWS.refresh, configPath, config);
      break;
      
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      process.exit(1);
  }
}

// Parse CLI arguments and execute
program.parse();