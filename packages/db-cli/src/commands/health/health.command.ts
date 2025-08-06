import chalk from 'chalk';
import { Command } from 'commander';

import { executeHealthCheck } from './health.action';
import { type HealthOptions, runHealthPreflight } from './health.preflight';

export const health = new Command()
  .name('health')
  .description('Check database connection and health status')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: HealthOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfig } = await runHealthPreflight(options);

      // Execute the action
      await executeHealthCheck(drizzleConfig);

      console.log(chalk.green('\nHealth check completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nHealth check failed: ${error}`));
      process.exit(1);
    }
  });
