# @pawo/drizzle-kit-alt

A higher-level abstraction over drizzle-kit that provides additional database management commands and workflows for TypeScript applications. Simplify your database operations with powerful commands like `reset` and `refresh`.

[![npm version](https://badge.fury.io/js/@pawo%2Fdrizzle-kit-alt.svg)](https://badge.fury.io/js/@pawo%2Fdrizzle-kit-alt)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Extended Commands** - Additional commands beyond drizzle-kit like `reset`, `refresh`, and `check`
- ✅ **Multi-Environment Support** - Built-in support for dev, test, staging, and production environments
- ✅ **Programmatic API** - Use commands programmatically in your scripts and tests
- ✅ **Type-safe** - Full TypeScript support with proper typing
- ✅ **Drizzle Kit Compatible** - Works seamlessly with your existing drizzle-kit configuration

## Installation

```bash
npm install @pawo/drizzle-kit-alt drizzle-kit
yarn add @pawo/drizzle-kit-alt drizzle-kit
bun add @pawo/drizzle-kit-alt drizzle-kit
```

## Quick Start

### CLI Usage

Use the `drizzle-kit-alt` CLI with your existing drizzle configuration:

```bash
# Check database connection
drizzle-kit-alt check

# Reset database (clear all data)
drizzle-kit-alt reset

# Refresh database (drop migrations + generate + reset + migrate)
drizzle-kit-alt refresh

# Standard drizzle-kit commands also work
drizzle-kit-alt generate
drizzle-kit-alt migrate
drizzle-kit-alt studio
drizzle-kit-alt push
drizzle-kit-alt drop
```

### Multi-Environment Support

Specify different environments with automatic config file detection:

```bash
# Uses drizzle.config.dev.ts
drizzle-kit-alt dev reset

# Uses drizzle.config.test.ts
drizzle-kit-alt test migrate

# Uses drizzle.config.staging.ts
drizzle-kit-alt staging check

# Uses drizzle.config.prod.ts (with confirmation prompts)
drizzle-kit-alt prod push
```

### Programmatic API

```typescript
import { resetDatabase, checkConnection } from '@pawo/drizzle-kit-alt';
import { defineConfig } from 'drizzle-kit';

// Define your drizzle config
const config = defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

// Check connection
const isConnected = await checkConnection(config);
console.log('Database connected:', isConnected);

// Reset database in tests
beforeEach(async () => {
  await resetDatabase(config);
});
```

## Commands

### Extended Commands

#### `reset`
Clears all data from the database while preserving the schema. Perfect for resetting test databases or clearing development data.

```bash
drizzle-kit-alt reset
```

#### `refresh`
Complete database refresh workflow that:
1. Drops the migrations folder
2. Generates new migrations
3. Resets the database
4. Applies migrations

```bash
drizzle-kit-alt refresh
```

#### `check`
Verifies database connection and reports the status.

```bash
drizzle-kit-alt check
```

### Standard Drizzle Kit Commands

All standard drizzle-kit commands are supported:

- `generate` - Generate new migrations
- `migrate` - Apply migrations
- `studio` - Open Drizzle Studio
- `push` - Push schema changes
- `drop` - Drop migrations folder

## Configuration

The tool uses your existing `drizzle.config.ts` file. No additional configuration needed!

For multi-environment setups, create environment-specific config files:
- `drizzle.config.dev.ts`
- `drizzle.config.test.ts`
- `drizzle.config.staging.ts`
- `drizzle.config.prod.ts`

## Supported Databases

Currently supports:
- **PostgreSQL** - All drivers (pg, postgres.js, @vercel/postgres, @neondatabase/serverless, pglite, aws-data-api)
- **SQLite** - All drivers (better-sqlite3, @libsql/client, turso, d1-http)

Not yet supported:
- L **MySQL**
- L **SingleStore**
- L **Gel**
- L **SQLite Expo driver**
- L **SQLite Durable Objects driver**

## API Reference

### resetDatabase(config: Config): Promise<void>

Resets the database by clearing all data while preserving schema.

```typescript
import { resetDatabase } from '@pawo/drizzle-kit-alt';

await resetDatabase(config);
```

### checkConnection(config: Config): Promise<boolean>

Checks if the database connection is working.

```typescript
import { checkConnection } from '@pawo/drizzle-kit-alt';

const isConnected = await checkConnection(config);
```

### createConnection(config: Config): Promise<DatabaseConnection>

Creates a database connection that can be used with Drizzle ORM.

```typescript
import { createConnection } from '@pawo/drizzle-kit-alt';

const { db } = await createConnection(config);
// Use db with your drizzle queries
```

## Use Cases

### Test Database Management

Perfect for managing test databases in your test suites:

```typescript
// jest.setup.ts or vitest.setup.ts
import { resetDatabase } from '@pawo/drizzle-kit-alt';
import config from './drizzle.config';

beforeEach(async () => {
  await resetDatabase(config);
});
```

### Development Workflow

Quick database refresh during development:

```bash
# Make schema changes
# Then refresh everything
drizzle-kit-alt refresh
```

### CI/CD Pipelines

```yaml
# .github/workflows/test.yml
- name: Setup test database
  run: |
    drizzle-kit-alt test migrate
    drizzle-kit-alt test check
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT � [paulwongx](https://github.com/paulwongx)