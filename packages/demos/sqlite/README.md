# SQLite Example

## Setup

```bash
# Install dependencies
bun install
```

## Quick Test

```bash
# Setup database
bun run db generate -e test
bun run db migrate -e test

# Test commands
bun run db check -e test
bun run db seed -e test
bun run db truncate -e test
bun run db reset -e test

# Verify with sqlite3
sqlite3 test.db "SELECT COUNT(*) FROM users;"
```

## Configuration

The example uses `db.config.ts` for db-cli configuration:
```typescript
import { defineConfig } from '@makeco/db-cli';

export default defineConfig({
  drizzleConfig: './drizzle.config.ts',
  seed: './src/seed.ts',
});
```

## Environment

Create `.env.test`:
```env
DATABASE_URL=./test.db
```