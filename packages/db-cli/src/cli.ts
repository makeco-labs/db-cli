#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';

// Import all commands from barrel export
import {
  drop,
  generate,
  health,
  list,
  migrate,
  pull,
  push,
  refresh,
  reset,
  seed,
  studio,
  truncate,
} from './commands';

// Handle process signals (simple and reliable)
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Handle basic errors (no fancy cleanup)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const packageVersion = packageJson.version;

function main() {
  const program = new Command()
    .name('db-cli')
    .description(
      'A higher-level abstraction over drizzle-kit with additional database management commands'
    )
    .version(packageVersion, '-v, --version', 'display the version number')
    .option('-c, --config <path>', 'Path to db.config.ts file');

  // Add all commands
  program
    .addCommand(health)
    .addCommand(generate)
    .addCommand(list)
    .addCommand(migrate)
    .addCommand(studio)
    .addCommand(push)
    .addCommand(pull)
    .addCommand(drop)
    .addCommand(seed)
    .addCommand(truncate)
    .addCommand(reset)
    .addCommand(refresh);

  // Add help examples
  program.addHelpText(
    'after',
    `

Commands:
  health   - Check database connection and health status
  generate - Generate new migrations from schema changes
  list     - List database tables and schemas
  ls       - List database tables and schemas (alias for list)
  migrate  - Apply pending migrations to the database
  studio   - Launch Drizzle Studio web interface
  push     - Push schema changes directly to database (no migrations)
  pull     - Pull database schema and generate TypeScript schema
  drop     - Drop migrations folder (drizzle-kit default behavior)
  seed     - Seed database with initial data (requires seed path in db.config.ts)
  truncate - Truncate database data while preserving table structure
  reset    - Clear database data (drop all tables and schemas)
  refresh  - Complete refresh: drop migrations → generate → clear data → migrate

`
  );

  program.parse();
}

main();
