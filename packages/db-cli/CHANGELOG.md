# Changelog

All notable changes to this project will be documented in this file.

## [0.1.11] - 2025-08-13

### Fixed
- **TypeScript Seed Files:** Fixed "Unknown file extension '.ts'" error when running seed command with TypeScript seed files
- **Seed Command:** All database dialects (PostgreSQL, MySQL, SQLite, Turso, SingleStore, Gel) now properly support TypeScript seed files using esbuild-register loader

### Enhanced
- **Seed Execution:** Added proper TypeScript compilation support with automatic loader registration and cleanup
- **File Validation:** Added file existence validation before attempting to execute seed files
- **Error Handling:** Improved error messages and cleanup with proper try/finally blocks for loader unregistration

### Technical
- **Dependencies:** Updated drizzle-kit from ^0.30.6 to ^0.31.4
- **CLI Versioning:** Refactored version management to dynamically import from package.json instead of hardcoded values

## [0.1.10] - 2025-08-13

### Added
- **Pull Command:** Added new `pull` command that uses `drizzle-kit pull` to pull database schema and generate TypeScript schema files
- **Schema Introspection:** Pull command supports all database types and environments, following the same pattern as other CLI commands

### Enhanced
- **Help Documentation:** Updated CLI help text to include the new pull command description
- **Command Coverage:** Now includes all standard drizzle-kit commands (generate, migrate, push, pull, studio, drop)

## [0.1.9] - 2025-08-13

### Fixed
- **TypeScript Compilation:** Fixed "require function not available in current environment" error by restoring proper createRequire import and logic for TypeScript file loading

## [0.1.8] - 2025-08-13

### Fixed
- **Driver Resolution:** Fixed critical issue where database drivers weren't found when using `bunx @makeco/db-cli`
- **Dependencies:** Moved database drivers from devDependencies to dependencies so they're available when CLI is installed globally

### Technical
- **Database Drivers:** PostgreSQL (pg, postgres, @vercel/postgres, @neondatabase/serverless), MySQL (mysql2, @planetscale/database), and SQLite (better-sqlite3, @libsql/client) drivers are now included as regular dependencies

## [0.1.7] - 2025-08-13

### Changed
- **Version Bump:** Updated version number only (dependency fix implemented in 0.1.8)

## [0.1.6] - 2025-08-13

### Improved
- **CLI Options:** Enhanced environment option validation with choices constraint for better UX
- **CLI Options:** Removed duplicate global/local config option conflicts - config is now global-only
- **CLI Options:** Standardized all environment options to use `.choices()` with immediate validation
- **Developer Experience:** Clear error messages for invalid environment choices (e.g., 'production' vs 'prod')
- **Help Text:** Environment options now display valid choices in help output

### Fixed
- **Commander.js:** Resolved option parsing conflicts between global and command-level config options
- **Validation:** Environment flags now provide immediate feedback instead of failing later in execution
- **Consistency:** All commands now follow the same option pattern - global config, local environment

### Technical
- **Architecture:** Moved config option to global scope, accessible via `command.parent.opts()`
- **Validation:** Added `ENV_CHOICES` constant for reusable Commander.js validation
- **Code Quality:** Renamed internal `config` properties to `configPath` for clarity

## [0.1.5] - 2025-08-11
- fix: Updated env loading logic

## [0.1.4] - 2025-08-06

### Fixes
- Fixed async functions that didn't use await expressions (removed unnecessary async modifiers)
- Fixed TypeScript build errors in list.preflight.ts by providing explicit boolean fallbacks
- Fixed 'any' type usage in confirmation.ts with proper type guards
- Updated import to use node:readline protocol for better Node.js compatibility
- Fixed unused parameters by prefixing with underscore
- Cleaned up code formatting and linting issues

### Technical Improvements
- Removed async/await from functions that only called synchronous operations
- Enhanced type safety in production environment detection
- Improved code organization and removed legacy imports

## [0.1.3] - 2025-08-05
- chore: Version bump to trigger release

## [0.1.2] - 2025-08-05
- fix: Updated exports to not trigger builds when importing defineConfig
- fix: Using package in scripts works properly now

## [0.1.1] - 2025-08-03

- Removed private from package.json
- Updated workflow to publish only this package and not include others

## [0.1.0] - 2025-08-03

### Core Features
- Database connection management with support for PostgreSQL, SQLite, MySQL, Turso, SingleStore, and Gel
- Multi-environment support (dev, test, staging, prod) with automatic config file discovery
- Type-safe configuration with defineConfig helper
- Integration with existing drizzle-kit workflows

### Commands
- **generate** - Generate new migrations from schema changes
- **migrate** - Apply pending migrations to the database
- **studio** - Launch Drizzle Studio web interface
- **push** - Push schema changes directly to database (no migrations)
- **drop** - Drop migrations folder
- **health** - Check database connection and health status with version information
- **seed** - Seed database with initial data using custom seed files
- **truncate** - Truncate database data while preserving table structure
- **reset** - Clear database data (drop all tables and schemas)
- **refresh** - Complete refresh workflow: drop migrations � generate � clear data � migrate

### Table Management
- **list** - List database tables and schemas
- **ls** - Unix-style alias for list command
- Row count support with --count flag for performance insights
- Long format support with -l flag (Unix convention)
- Compact output format with --compact flag for dense display
- Formatted row counts with K/M suffixes for large numbers
- Schema-aware output for PostgreSQL/MySQL with tree structure
- Numbered list format for SQLite databases
- Summary statistics showing total schemas, tables, and row counts

### Configuration & Setup
- Automatic discovery of drizzle config files
- Support for db.config.ts files with seed functionality
- Environment-specific config files (drizzle.config.dev.ts, etc.)
- Configuration validation and error handling
- Custom seed file support with type-safe database connections

### Developer Experience
- Comprehensive CLI help with command descriptions and examples
- Flag validation to prevent incorrect usage
- Colored output for better readability
- Progress indicators and status messages
- Error handling with descriptive messages
- Multi-environment workflow support

### Database Support
- **PostgreSQL** - Fully tested with all drivers (pg, postgres.js, @vercel/postgres, @neondatabase/serverless, pglite, aws-data-api)
- **SQLite** - Fully tested with all drivers (better-sqlite3, @libsql/client, turso, d1-http)
- **MySQL** - Implementation exists (untested)
- **SingleStore** - Implementation exists (untested)
- **Turso** - Implementation exists (untested)
- **Gel** - Implementation exists (untested)