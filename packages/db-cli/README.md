# @makeco/db-cli

> ⚠️ **Experimental Package**
>
> This package is currently in development and should be considered experimental. Only postgres and sqlite are tested. The API may change at any time.

A powerful database CLI tool that extends drizzle-kit with additional commands for database management workflows. Simplify your database operations with powerful commands like `reset` which drops all schemas/tables and `refresh` which drops migrations → generates migrations → resets db schemas/tables → migrate schemas .

[![npm version](https://badge.fury.io/js/@makeco%2Fdb-cli.svg)](https://badge.fury.io/js/@makeco%2Fdb-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @makeco/db-cli drizzle-kit
yarn add @makeco/db-cli drizzle-kit
bun add @makeco/db-cli drizzle-kit
```

## Quick Start

1. Add a `db` script to your package.json scripts with the config flag:

```json
{
	"scripts": {
		"db": "bunx @makeco/db-cli -c ./db.config.ts"
	}
}
```

2. Define a `db.config.ts` file in your project.

```ts
import { defineConfig } from "@makeco/db-cli";

export default defineConfig({
	drizzleConfig: "./drizzle.config.ts",
	seed: "./src/scripts/db.seed.ts",
});
```

3. Add a `db.seed.ts` file

Note: Your seed file should export a default function.

```typescript
// src/scripts/db.seed.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { roles } from "../schemas";

const db = drizzle(process.env.DATABASE_URL);

export default async function seed() {
	await db.insert(roles).values([
		{ name: 'admin', permissions: ['read', 'write', 'delete'] },
		{ name: 'user', permissions: ['read'] }
	]);
}
```

Then run commands with:

```bash
bun db generate
bun db migrate
bun db seed
bun db list --count
```

### Commands

```bash
  drop          # Drop migrations folder (drizzle-kit default behavior)
  generate      # Generate new migrations from schema changes
  migrate       # Apply pending migrations to the database
  studio        # Launch Drizzle Studio web interface
  push          # Push schema changes directly to database (no migrations)
  health        # Check database connection and health status
  ls            # List database tables and schemas (alias for list)
  seed          # Seed database with initial data (requires seed path in db.config.ts)
  truncate      # Truncate database data while preserving table structure
  reset         # Clear database data (drop all tables and schemas)
  refresh       # Complete refresh: drop migrations → generate → clear data → migrate
```

## Database Support Status

| Database    | Status      | Notes                                           |
| ----------- | ----------- | ----------------------------------------------- |
| PostgreSQL  | ✅ Tested   | Manually tested and working                     |
| SQLite      | ✅ Tested   | Manually tested and working                     |
| MySQL       | ⚠️ Untested | Implementation exists but not officially tested |
| Turso       | ⚠️ Untested | Implementation exists but not officially tested |
| SingleStore | ⚠️ Untested | Implementation exists but not officially tested |
| Gel         | ⚠️ Untested | Implementation exists but not officially tested |

## License

MIT © [@makeco](https://github.com/makeco-labs)
