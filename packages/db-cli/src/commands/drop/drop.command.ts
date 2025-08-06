import chalk from 'chalk';
import { Command } from 'commander';

import { executeDrizzleCommand } from './drop.action';
import { type DropOptions, runDropPreflight } from './drop.preflight';

export const drop = new Command()
  .name('drop')
  .description('Drop migrations folder (drizzle-kit default behavior)')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: DropOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } = await runDropPreflight(options);

      // Execute the action
      executeDrizzleCommand('drop', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nDrop completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nDrop failed: ${error}`));
      process.exit(1);
    }
  });
