# PostgreSQL Example

This example demonstrates using `drizzle-kit-alt` with PostgreSQL.

## Setup

1. Make sure the test database is running:
   ```bash
   # From the root of the project
   docker compose -f docker-compose.test.yml up -d
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the CLI tool (run from the root of the project):
   ```bash
   npm link
   cd examples/postgres
   npm link @pawo/drizzle-kit-alt
   ```

## Usage

Use the CLI through the npm script:

```bash
# Check database connection  
npm run db check -e test

# Generate migrations
npm run db generate -e test

# Run migrations
npm run db migrate -e test

# Reset database (clear all user data)
npm run db reset -e test

# Open Drizzle Studio
npm run db studio -e test
```

Or run directly:
```bash
npx drizzle-kit-alt check -c ./drizzle.config.ts -e test
npx drizzle-kit-alt reset -c ./drizzle.config.ts -e test
```

## Environment Variables

The `.env.test` file contains:
- `NODE_ENV=test`
- `DATABASE_URL=postgresql://postgres_test:postgres_test@localhost:15432/postgres_test`

## Schema

The example includes a simple blog schema with:
- `users` - User accounts
- `posts` - Blog posts 
- `comments` - Comments on posts