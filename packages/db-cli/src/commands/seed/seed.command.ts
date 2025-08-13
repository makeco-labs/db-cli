import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeSeedDatabase } from './seed.action';
import { runSeedPreflight, type SeedOptions } from './seed.preflight';

export const seed = new Command()
  .name('seed')
  .description(
    'Seed database with initial data (requires seed path in db.config.ts)'
  )
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: SeedOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfig, seedPath } = await runSeedPreflight({
        ...options,
        configPath,
      });

      // Execute the action
      await executeSeedDatabase(drizzleConfig, seedPath);

      console.log(chalk.green('\nSeed completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nSeed failed: ${error}`));
      process.exit(1);
    }
  });
