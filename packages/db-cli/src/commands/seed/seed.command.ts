import chalk from 'chalk';
import { Command } from 'commander';

import { executeSeedDatabase } from './seed.action';
import { runSeedPreflight, type SeedOptions } from './seed.preflight';

export const seed = new Command()
  .name('seed')
  .description(
    'Seed database with initial data (requires seed path in db.config.ts)'
  )
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: SeedOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfig, seedPath } = await runSeedPreflight(options);

      // Execute the action
      await executeSeedDatabase(drizzleConfig, seedPath);

      console.log(chalk.green('\nSeed completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nSeed failed: ${error}`));
      process.exit(1);
    }
  });
