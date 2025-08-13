# Changelog

All notable changes to this project will be documented in this file.

## [0.1.7] - 2025-08-13

### Fixed
- **Driver Resolution:** Fixed critical issue where database drivers weren't found when using `bunx @makeco/db-cli` in monorepos
- **Bundling:** CLI now uses esbuild bundling with external driver dependencies, matching drizzle-kit's approach
- **Monorepo Support:** Database drivers are now properly resolved from user's project node_modules, including parent directories

### Technical
- **Build System:** Migrated from TypeScript compilation to esbuild bundling for better dependency resolution
- **External Dependencies:** Database drivers (pg, postgres, mysql2, etc.) are marked as external and resolved at runtime
- **CLI Distribution:** Binary changed from `cli.js` to `cli.cjs` for better CommonJS compatibility
- **Module Resolution:** Added proper support for Node.js module resolution algorithm in monorepo environments

### Breaking Changes
- **Binary Path:** CLI binary path changed from `./dist/cli.js` to `./dist/cli.cjs` (automatic for npm users)

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