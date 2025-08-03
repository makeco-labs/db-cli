# DB CLI Tools

A collection of powerful database management tools that extend drizzle-kit with additional commands for streamlined database workflows.

## Packages

### [@makeco/db-cli](./packages/db-cli)

A comprehensive database CLI tool that adds powerful commands like `reset`, `refresh`, `check`, `seed`, and `truncate` to your drizzle-kit workflow.

**Key Features:**
- 🗄️ **Extended Commands** - Beyond drizzle-kit: reset, refresh, check, seed, truncate
- 🌱 **Database Seeding** - Type-safe seeding with configuration files  
- 🔄 **Multi-Environment** - Built-in support for dev, test, staging, prod
- 🧪 **Test-Friendly** - Perfect for test database management
- 📝 **TypeScript** - Full type safety and IntelliSense support

**Quick Start:**
```bash
npm install @makeco/db-cli drizzle-kit

# Basic commands
db-cli check          # Check database connection
db-cli reset          # Clear data, keep schema
db-cli truncate       # Delete data, keep structure  
db-cli seed           # Load initial data
db-cli refresh        # Complete database refresh
```

**📖 [Complete Documentation](./packages/db-cli/README.md)**

## Supported Databases

- **PostgreSQL** - All drivers (pg, postgres.js, @vercel/postgres, @neondatabase/serverless, pglite, aws-data-api)
- **SQLite** - All drivers (better-sqlite3, @libsql/client, turso, d1-http)

## Development

Test databases are managed via Docker Compose:

```bash
# Start all test databases
docker compose up -d

# Start specific database
docker compose up -d postgres
docker compose up -d mysql

# Stop all databases
docker compose down
```

## License

MIT © [paulwongx](https://github.com/paulwongx)