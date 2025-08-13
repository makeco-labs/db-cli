import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeDrizzleCommand } from './pull.action';
import { type PullOptions, runPullPreflight } from './pull.preflight';

export const pull = new Command()
  .name('pull')
  .description('Pull database schema and generate TypeScript schema')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: PullOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } = await runPullPreflight({
        ...options,
        configPath,
      });

      // Execute the action
      executeDrizzleCommand('pull', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nPull completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nPull failed: ${error}`));
      process.exit(1);
    }
  });