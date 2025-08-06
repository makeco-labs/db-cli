import chalk from 'chalk';
import { Command } from 'commander';

import { executeDrizzleCommand } from './push.action';
import { type PushOptions, runPushPreflight } from './push.preflight';

export const push = new Command()
  .name('push')
  .description('Push schema changes directly to database (no migrations)')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: PushOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } = await runPushPreflight(options);

      // Execute the action
      executeDrizzleCommand('push', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nPush completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nPush failed: ${error}`));
      process.exit(1);
    }
  });
