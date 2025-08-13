import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeDrizzleCommand } from './push.action';
import { type PushOptions, runPushPreflight } from './push.preflight';

export const push = new Command()
  .name('push')
  .description('Push schema changes directly to database (no migrations)')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: PushOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;
      
      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } = await runPushPreflight({
        ...options,
        configPath: configPath
      });

      // Execute the action
      executeDrizzleCommand('push', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nPush completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nPush failed: ${error}`));
      process.exit(1);
    }
  });
