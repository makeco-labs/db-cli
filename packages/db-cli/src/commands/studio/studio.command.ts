import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeStudioCommand } from './studio.action';
import { runStudioPreflight, type StudioOptions } from './studio.preflight';

export const studio = new Command()
  .name('studio')
  .description('Launch Drizzle Studio web interface')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: StudioOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } = await runStudioPreflight({
        ...options,
        configPath,
      });

      // Execute the action
      executeStudioCommand('studio', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nStudio session ended.'));
    } catch (error) {
      console.error(chalk.red(`\nStudio failed: ${error}`));
      process.exit(1);
    }
  });
