import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeHealthCheck } from './health.action';
import { type HealthOptions, runHealthPreflight } from './health.preflight';

export const health = new Command()
  .name('health')
  .description('Check database connection and health status')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: HealthOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;
      
      // Run preflight checks and setup
      const { drizzleConfig } = await runHealthPreflight({
        ...options,
        configPath: configPath
      });

      // Execute the action
      await executeHealthCheck(drizzleConfig);

      console.log(chalk.green('\nHealth check completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nHealth check failed: ${error}`));
      process.exit(1);
    }
  });
