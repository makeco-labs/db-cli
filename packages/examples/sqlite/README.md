# SQLite Example

This example demonstrates using `drizzle-kit-alt` with SQLite.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Link the CLI tool (run from the root of the project):
   ```bash
   bun link
   cd examples/sqlite
   bun link @pawo/drizzle-kit-alt
   ```

## Usage

Use the CLI through the npm script:

```bash
# Check database connection  
bun run db check -e test

# Generate migrations
bun run db generate -e test

# Run migrations
bun run db migrate -e test

# Reset database (clear all user data)
bun run db reset -e test

# Open Drizzle Studio
bun run db studio -e test
```

Or run directly:
```bash
npx drizzle-kit-alt check -c ./drizzle.config.ts -e test
npx drizzle-kit-alt reset -c ./drizzle.config.ts -e test
```

## Environment Variables

The example includes multiple environment files:
- `.env.test` - Uses `./test.db` database file
- `.env.dev` - Uses `./dev.db` database file

## Schema

The example includes a simple blog schema with:
- `users` - User accounts
- `posts` - Blog posts 
- `comments` - Comments on posts

## Testing Reset Functionality

1. Generate and run migrations:
   ```bash
   bun run db generate -e test
   bun run db migrate -e test
   ```

2. Add some test data using the provided SQL file or manually:
   ```bash
   sqlite3 test.db < test-data.sql
   ```

3. Verify data exists:
   ```bash
   sqlite3 test.db "SELECT * FROM users;"
   ```

4. Test the reset functionality:
   ```bash
   bun run db reset -e test
   ```

5. Verify data is cleared:
   ```bash
   sqlite3 test.db "SELECT * FROM users;"
   ```

The reset should clear all user data but preserve the schema and migration history.