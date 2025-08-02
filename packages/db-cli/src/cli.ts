#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';

// Import drizzle-kit types
import type { Config } from 'drizzle-kit';

// Import database functionality
import { resetDatabase } from './reset';
import { checkConnection } from './check';
import { seedDatabase } from './seed';
import { truncateDatabase } from './truncate';

// Import centralized config utilities
import { resolveConfigs } from '@makeco/db-cli/utils/config';
import type { DbCliConfig } from '@makeco/db-cli/types';

// Types for supported commands
type DrizzleKitCommand = 'generate' | 'migrate' | 'studio' | 'drop' | 'push';
type ActionKey = DrizzleKitCommand | 'reset' | 'refresh' | 'check' | 'seed' | 'truncate';
type EnvironmentKey = 'dev' | 'test' | 'staging' | 'prod';

const validEnvironments: EnvironmentKey[] = ['dev', 'test', 'staging', 'prod'];
const validActions: ActionKey[] = ['generate', 'migrate', 'studio', 'drop', 'push', 'reset', 'refresh', 'check', 'seed', 'truncate'];

const actionDescriptions: Record<ActionKey, string> = {
  generate: '[generate]: Generate new migrations',
  migrate: '[migrate]: Apply migrations',
  studio: '[studio]: Open Drizzle Studio',
  drop: '[drop]: Drop migrations folder',
  push: '[push]: Push schema changes',
  reset: '[reset]: Reset database data',
  refresh: '[refresh]: Refresh database (drop + generate + reset + migrate)',
  check: '[check]: Check database connection',
  seed: '[seed]: Seed database with initial data',
  truncate: '[truncate]: Truncate database (delete data, keep structure)',
};

// Updated workflow definitions - drop vs reset distinction
const WORKFLOWS = {
  reset: ['reset', 'migrate'] as const,          // Clear database data, then migrate
  refresh: ['drop', 'generate', 'reset', 'migrate'] as const, // Drop migrations, generate, clear data, migrate
} as const;


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
 * Executes database seeding
 */
async function executeSeed(config: Config, seedPath: string): Promise<void> {
  console.log(`\n🌱 Seeding database from: ${seedPath}...`);
  
  try {
    const result = await seedDatabase(config, seedPath);
    
    if (result.success) {
      console.log(`✅ Database seeded successfully!`);
      if (result.message) {
        console.log(result.message);
      }
    } else {
      throw new Error(result.error || 'Database seeding failed');
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Executes database truncate (delete data, keep structure)
 */
async function executeTruncate(config: Config): Promise<void> {
  console.log('\n🗑️ Truncating database data...');
  
  try {
    const result = await truncateDatabase(config);
    
    if (result.success) {
      console.log(`✅ Database truncate completed successfully!`);
      if (result.tablesTruncated.length > 0) {
        console.log(`Truncated ${result.tablesTruncated.length} tables:`, result.tablesTruncated.join(', '));
      }
    } else {
      throw new Error(result.error || 'Database truncate failed');
    }
  } catch (error) {
    console.error('❌ Database truncate failed:', error instanceof Error ? error.message : 'Unknown error');
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
  .name('db-cli')
  .description('A higher-level abstraction over drizzle-kit with additional database management commands')
  .version('0.1.0')
  .argument('[action]', 'Action to perform (generate, migrate, studio, etc.)')
  .action(async (action, options) => {
    // Interactive mode when no action is provided or invalid action
    const chosenAction = await determineAction(action);
    const chosenEnv = await determineEnvironment(options.env);
    
    // Load environment variables
    loadEnvironment(chosenEnv);
    
    // Resolve configs using centralized system
    const { drizzleConfig, dbCliConfig, configPath: resolvedConfigPath } = await resolveConfigs(options.config);
    console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
    
    // Execute the chosen action
    await executeAction(chosenAction, resolvedConfigPath, drizzleConfig, dbCliConfig);
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
      
      // Resolve configs using centralized system
      const configPath = options.config || cmd.parent?.opts().config;
      const { drizzleConfig, configPath: resolvedConfigPath } = await resolveConfigs(configPath);
      
      validateDrizzleKit();
      
      console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
      
      executeCommand(command, resolvedConfigPath);
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
    
    // Resolve configs using centralized system
    const configPath = options.config || cmd.parent?.opts().config;
    const { drizzleConfig, configPath: resolvedConfigPath } = await resolveConfigs(configPath);
    
    validateDrizzleKit();
    
    console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
    
    await requireProductionConfirmation('reset', drizzleConfig);
    await executeWorkflow(WORKFLOWS.reset, resolvedConfigPath, drizzleConfig);
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
    
    // Resolve configs using centralized system
    const configPath = options.config || cmd.parent?.opts().config;
    const { drizzleConfig, configPath: resolvedConfigPath } = await resolveConfigs(configPath);
    
    validateDrizzleKit();
    
    console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
    
    await requireProductionConfirmation('refresh', drizzleConfig);
    await executeWorkflow(WORKFLOWS.refresh, resolvedConfigPath, drizzleConfig);
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
    
    // Resolve configs using centralized system
    const configPath = options.config || cmd.parent?.opts().config;
    const { drizzleConfig, configPath: resolvedConfigPath } = await resolveConfigs(configPath);
    
    console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
    
    await executeCheck(drizzleConfig);
  });

// Add custom seed command
program
  .command('seed')
  .description('Seed database with initial data (requires db-cli.config.ts)')
  .option('-c, --config <path>', 'Path to db-cli config file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options, cmd) => {
    // Determine environment (required)
    const envName = options.env || cmd.parent?.opts().env;
    const chosenEnv = await determineEnvironment(envName);
    loadEnvironment(chosenEnv);
    
    // Resolve configs using centralized system
    const { drizzleConfig, dbCliConfig, configPath: resolvedConfigPath } = await resolveConfigs(options.config);
    console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
    
    // Execute seed
    await executeAction('seed', resolvedConfigPath, drizzleConfig, dbCliConfig);
  });

// Add custom truncate command
program
  .command('truncate')
  .description('Truncate database (delete all data but keep table structure)')
  .option('-c, --config <path>', 'Path to drizzle config file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options, cmd) => {
    // Determine environment (required)
    const envName = options.env || cmd.parent?.opts().env;
    const chosenEnv = await determineEnvironment(envName);
    loadEnvironment(chosenEnv);
    
    // Resolve configs using centralized system
    const { drizzleConfig, configPath: resolvedConfigPath } = await resolveConfigs(options.config);
    console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
    
    // Require production confirmation for destructive operation
    await requireProductionConfirmation('truncate', drizzleConfig);
    
    // Execute truncate
    await executeAction('truncate', resolvedConfigPath, drizzleConfig);
  });

// Add help examples
program.addHelpText('after', `

Examples:
  $ db-cli generate              # Generate migrations
  $ db-cli migrate               # Run migrations
  $ db-cli studio                # Launch Drizzle Studio
  $ db-cli drop                  # Drop migrations folder (drizzle-kit)
  $ db-cli check                 # Check database connection and health
  $ db-cli seed                  # Seed database (requires db-cli.config.ts)
  $ db-cli truncate              # Truncate database (delete data, keep structure)
  $ db-cli reset                 # Clear database data + migrate
  $ db-cli refresh               # Drop migrations + generate + clear data + migrate
  $ db-cli generate --config ./custom.config.ts  # Use custom config
  $ db-cli -c ./my-config.ts migrate             # Use global config flag
  $ db-cli reset -e test                         # Load .env.test file
  $ db-cli migrate -e prod                       # Load .env.prod file

Commands:
  drop     - Drops migrations folder (drizzle-kit default behavior)
  check    - Checks database connection and displays version information
  seed     - Seeds database with initial data (requires db-cli.config.ts with seed path)
  truncate - Truncates database data while preserving table structure
  reset    - Clears database data, then runs migrations
  refresh  - Complete refresh: drop migrations → generate → clear data → migrate

Environment:
  Set NODE_ENV=production to enable production safety checks.

Config Discovery:
  The CLI will automatically discover config files in this order:
  1. --config/-c flag value (auto-detects db-cli.config.ts vs drizzle.config.ts)
  2. db-cli.config.ts (if exists, includes seed functionality)
  3. drizzle.config.ts
  4. drizzle.config.js
  5. drizzle.config.mjs
  6. drizzle.config.cjs
`);

/**
 * Execute the chosen action
 */
async function executeAction(action: ActionKey, configPath: string, config: Config, dbCliConfig?: DbCliConfig): Promise<void> {
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
      
    case 'seed':
      if (!dbCliConfig?.seed) {
        console.error('❌ Error: Seed command requires a db-cli.config.ts file with a "seed" property');
        console.error('Example db-cli.config.ts:');
        console.error(`import { defineConfig } from '@makeco/db-cli';`);
        console.error(`export default defineConfig({`);
        console.error(`  drizzleConfig: './drizzle.config.ts',`);
        console.error(`  seed: './src/db/seed.ts'`);
        console.error(`});`);
        process.exit(1);
      }
      await executeSeed(config, dbCliConfig.seed);
      break;
      
    case 'truncate':
      await executeTruncate(config);
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