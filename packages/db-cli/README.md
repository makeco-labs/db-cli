# @makeco/db-cli

> ⚠️ **Experimental Package - Not Production Ready**
> 
> This package is currently in active development and should be considered experimental. The API may change at any time.

A powerful database CLI tool that extends drizzle-kit with additional commands for database management workflows. Simplify your database operations with powerful commands like `reset` and `refresh`.

[![npm version](https://badge.fury.io/js/@makeco%2Fdb-cli.svg)](https://badge.fury.io/js/@makeco%2Fdb-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Database Support Status

| Database | Status | Notes |
|----------|---------|-------|
| PostgreSQL | ✅ Tested | Fully tested and working |
| SQLite | ✅ Tested | Fully tested and working |
| MySQL | ⚠️ Untested | Implementation exists but not officially tested |
| Turso | ⚠️ Untested | Implementation exists but not officially tested |
| SingleStore | ⚠️ Untested | Implementation exists but not officially tested |
| Gel | ⚠️ Untested | Implementation exists but not officially tested |

## Features

- ✅ **Extended Commands** - Additional commands beyond drizzle-kit like `reset`, `refresh`, `health`, and `seed`
- ✅ **Multi-Environment Support** - Built-in support for dev, test, staging, and production environments
- ✅ **Database Seeding** - Type-safe database seeding with db-cli configuration files
- ✅ **Programmatic API** - Use commands programmatically in your scripts and tests
- ✅ **Type-safe** - Full TypeScript support with proper typing
- ✅ **Drizzle Kit Compatible** - Works seamlessly with your existing drizzle-kit configuration

## Installation

```bash
npm install @makeco/db-cli drizzle-kit
yarn add @makeco/db-cli drizzle-kit
bun add @makeco/db-cli drizzle-kit
```

## Quick Start

### CLI Usage

Use the `db-cli` command with your existing drizzle configuration:

```bash
# Check database connection
db-cli health

# Seed database with initial data (requires db.config.ts)
db-cli seed

# Reset database (clear all data)
db-cli reset

# Refresh database (drop migrations + generate + reset + migrate)
db-cli refresh

# Standard drizzle-kit commands also work
db-cli generate
db-cli migrate
db-cli studio
db-cli push
db-cli drop
```

### Multi-Environment Support

Specify different environments with automatic config file detection:

```bash
# Uses drizzle.config.dev.ts
db-cli dev reset

# Uses drizzle.config.test.ts
db-cli test migrate

# Uses drizzle.config.staging.ts
db-cli staging health

# Uses drizzle.config.prod.ts (with confirmation prompts)
db-cli prod push
```

### Programmatic API

```typescript
import { resetDatabase, checkHealth } from '@makeco/db-cli';
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
const healthResult = await checkHealth(config);
const isConnected = healthResult.status === 'ok';
console.log('Database connected:', isConnected);

// Reset database in tests
beforeEach(async () => {
  await resetDatabase(config);
});
```

## Commands

### Extended Commands

#### `seed`
Seeds the database with initial data using a custom seed file. Requires a `db.config.ts` configuration file.

```bash
db-cli seed
```

#### `reset`
Clears all data from the database while preserving the schema. Perfect for resetting test databases or clearing development data.

```bash
db-cli reset
```

#### `refresh`
Complete database refresh workflow that:
1. Drops the migrations folder
2. Generates new migrations
3. Resets the database
4. Applies migrations

```bash
db-cli refresh
```

#### `health`
Checks database connection and health status, including version information.

```bash
db-cli health
```

### Standard Drizzle Kit Commands

All standard drizzle-kit commands are supported:

- `generate` - Generate new migrations
- `migrate` - Apply migrations
- `studio` - Open Drizzle Studio
- `push` - Push schema changes
- `drop` - Drop migrations folder

## Configuration

### Basic Configuration

The tool uses your existing `drizzle.config.ts` file. No additional configuration needed for basic commands!

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Enhanced Configuration with db.config.ts

For additional features like database seeding, create a `db.config.ts` file:

```typescript
// db.config.ts
import { defineConfig } from '@makeco/db-cli';

export default defineConfig({
  drizzleConfig: './drizzle.config.ts', // Path to your drizzle config
  seed: './src/db/seed.ts',             // Path to your seed file
});
```

Your seed file should export a default function:

```typescript
// src/db/seed.ts
import { users, posts } from './schema';

export default async function seed(db: any) {
  // Insert initial data
  await db.insert(users).values([
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
  ]);

  await db.insert(posts).values([
    { title: 'First Post', content: 'Hello, world!' },
    { title: 'Second Post', content: 'Another post!' },
  ]);
}
```

### Configuration Discovery

The CLI automatically discovers config files in this order:
1. `--config/-c` flag value (auto-detects db.config.ts vs drizzle.config.ts)
2. `db.config.ts` (if exists, includes seed functionality)
3. `drizzle.config.ts`
4. `drizzle.config.js`
5. `drizzle.config.mjs`
6. `drizzle.config.cjs`

### Multi-Environment Setup

For multi-environment setups, create environment-specific config files:
- `drizzle.config.dev.ts`
- `drizzle.config.test.ts`
- `drizzle.config.staging.ts`
- `drizzle.config.prod.ts`

## Supported Databases

**Fully Tested & Working:**
- **PostgreSQL** - All drivers (pg, postgres.js, @vercel/postgres, @neondatabase/serverless, pglite, aws-data-api)
- **SQLite** - All drivers (better-sqlite3, @libsql/client, turso, d1-http)

**Implementation Exists (Untested):**
- **MySQL** - May have errors, not officially tested
- **SingleStore** - May have errors, not officially tested  
- **Turso** - May have errors, not officially tested
- **Gel** - May have errors, not officially tested

**Not Yet Supported:**
- **SQLite Expo driver**
- **SQLite Durable Objects driver**

## API Reference

### seedDatabase(config: Config, seedPath: string): Promise<SeedResult>

Seeds the database with initial data from a seed file.

```typescript
import { seedDatabase } from '@makeco/db-cli';

await seedDatabase(config, './src/db/seed.ts');
```

### resetDatabase(config: Config): Promise<ResetResult>

Resets the database by clearing all data while preserving schema.

```typescript
import { resetDatabase } from '@makeco/db-cli';

await resetDatabase(config);
```

### checkHealth(config: Config): Promise<CheckResult>

Checks database connection and health status.

```typescript
import { checkHealth } from '@makeco/db-cli';

const result = await checkHealth(config);
console.log('Status:', result.status);
if (result.version) {
  console.log('Version:', result.version);
}
```

### createConnection(config: Config): Promise<DatabaseConnection>

Creates a database connection that can be used with Drizzle ORM.

```typescript
import { createConnection } from '@makeco/db-cli';

const { db } = await createConnection(config);
// Use db with your drizzle queries
```

### defineConfig(config: DbCliConfig): DbCliConfig

Type-safe configuration helper for db.config.ts files.

```typescript
import { defineConfig } from '@makeco/db-cli';

export default defineConfig({
  drizzleConfig: './drizzle.config.ts',
  seed: './src/db/seed.ts',
});
```

## Use Cases

### Database Seeding

Set up initial data for development or testing:

```typescript
// src/db/seed.ts
import { db } from './connection';
import { users, posts } from './schema';

export default async function seed(connection: any) {
  // Clear existing data (optional)
  await connection.delete(posts);
  await connection.delete(users);

  // Insert initial users
  const [user1, user2] = await connection.insert(users).values([
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
  ]).returning();

  // Insert initial posts
  await connection.insert(posts).values([
    { title: 'Welcome Post', content: 'Welcome to our platform!', authorId: user1.id },
    { title: 'Getting Started', content: 'Here\'s how to get started...', authorId: user2.id },
  ]);
}
```

Then run:
```bash
db-cli seed
```

### Test Database Management

Perfect for managing test databases in your test suites:

```typescript
// jest.setup.ts or vitest.setup.ts
import { resetDatabase, seedDatabase } from '@makeco/db-cli';
import config from './drizzle.config';

beforeEach(async () => {
  await resetDatabase(config);
  await seedDatabase(config, './src/db/test-seed.ts');
});
```

### Development Workflow

Quick database refresh during development:

```bash
# Make schema changes
# Then refresh everything
db-cli refresh

# Add some test data
db-cli seed
```

### CI/CD Pipelines

```yaml
# .github/workflows/test.yml
- name: Setup test database
  run: |
    db-cli test migrate
    db-cli test health
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT � [paulwongx](https://github.com/paulwongx)