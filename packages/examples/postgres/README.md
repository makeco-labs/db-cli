# PostgreSQL Example

## Setup

```bash
# Start test database
docker compose up -d

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
```

## Environment

Create `.env.test`:
```env
DATABASE_URL=postgresql://postgres_test:postgres_test@localhost:15432/postgres_test
```