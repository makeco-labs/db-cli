#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import type { Config } from 'drizzle-kit';
import type { DbCliConfig } from '../types';

// Import modules
// import { setupSignalHandlers } from './signals';
import { determineEnvironment, determineAction } from './prompts';
import { validateDrizzleKit, executeCommand } from '../actions';
import { executeCheck, executeSeed, executeTruncate } from '../actions';
import { executeWorkflow, requireProductionConfirmation, WORKFLOWS } from '../actions';
import { resolveConfigs } from '../utils/config';

// Setup signal handlers
// setupSignalHandlers(); // Temporarily disabled to test double execution

/**
 * Execute the chosen action
 */
async function executeAction(action: string, configPath: string, config: Config, envName: string, dbCliConfig?: DbCliConfig): Promise<void> {
  switch (action) {
    case 'generate':
    case 'migrate':
    case 'studio':
    case 'drop':
    case 'push':
      if (action !== 'studio') {
        validateDrizzleKit();
      }
      executeCommand(action, configPath, envName);
      break;
      
    case 'check':
      await executeCheck(config);
      break;
      
    case 'seed':
      if (!dbCliConfig?.seed) {
        console.error('❌ Error: Seed command requires a db.config.ts file with a "seed" property');
        console.error('Example db.config.ts:');
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
      await executeWorkflow(WORKFLOWS.reset, configPath, config, envName);
      break;
      
    case 'refresh':
      validateDrizzleKit();
      await requireProductionConfirmation('refresh', config);
      await executeWorkflow(WORKFLOWS.refresh, configPath, config, envName);
      break;
      
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      process.exit(1);
  }
}

// Create the CLI program
const program = new Command();

program
  .name('db-cli')
  .description('A higher-level abstraction over drizzle-kit with additional database management commands')
  .version('0.1.0')
  .argument('[action]', 'Action to perform (generate, migrate, studio, etc.)')
  .option('-c, --config <path>', 'Path to config file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (actionInput, options) => {
    console.log('DEBUG: Main action called');
    try {
      // Determine environment and action using original pattern
      const chosenEnv = await determineEnvironment(options.env);
      
      const chosenAction = await determineAction(actionInput);
      
      // Resolve configs using centralized system
      const { drizzleConfig, dbCliConfig, configPath: resolvedConfigPath } = await resolveConfigs(options.config);
      console.log(chalk.cyan(`Using config: ${resolvedConfigPath} (dialect: ${drizzleConfig.dialect})`));
      
      // Execute the chosen action
      await executeAction(chosenAction, resolvedConfigPath, drizzleConfig, chosenEnv, dbCliConfig);
      
      // Exit successfully after command completion
      process.exit(0);
    } catch {
      console.error(chalk.red(`\n❌ Operation failed during action: ${actionInput}`));
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText('after', `

Examples:
  $ db-cli generate              # Generate migrations
  $ db-cli migrate               # Run migrations
  $ db-cli studio                # Launch Drizzle Studio
  $ db-cli drop                  # Drop migrations folder (drizzle-kit)
  $ db-cli check                 # Check database connection and health
  $ db-cli seed                  # Seed database (requires db.config.ts)
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
  seed     - Seeds database with initial data (requires db.config.ts with seed path)
  truncate - Truncates database data while preserving table structure
  reset    - Clears database data, then runs migrations
  refresh  - Complete refresh: drop migrations → generate → clear data → migrate

Environment:
  Set NODE_ENV=production to enable production safety checks.

Config Discovery:
  The CLI will automatically discover config files in this order:
  1. --config/-c flag value (auto-detects db.config.ts vs drizzle.config.ts)
  2. db.config.ts (if exists, includes seed functionality)
  3. drizzle.config.ts
  4. drizzle.config.js
  5. drizzle.config.mjs
  6. drizzle.config.cjs
`);

// Parse CLI arguments and execute
program.parseAsync(process.argv).catch(error => {
  console.error(chalk.red('An unexpected error occurred outside the main action handler:'), error);
  process.exit(1);
});