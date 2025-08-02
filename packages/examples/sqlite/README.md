# SQLite Example

## Setup

```bash
# Install and link
bun install
bun link ../../
```

## Quick Test

```bash
# Setup database
bun run db generate -e test
bun run db migrate -e test

# Test commands
bun run db check -e test
bun run db:seed -e test
bun run db truncate -e test
bun run db reset -e test

# Verify with sqlite3
sqlite3 test.db "SELECT COUNT(*) FROM users;"
```

## Environment

Create `.env.test`:
```env
DATABASE_URL=./test.db
```