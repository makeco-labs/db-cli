# DB CLI Tool

A powerful database management tool that extend drizzle-kit with additional commands for streamlined database workflows.

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
yarn add @makeco/db-cli drizzle-kit
bun add @makeco/db-cli drizzle-kit
```

```bash

# Commands
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

**📖 [Complete Documentation](./packages/db-cli/README.md)**

## License

MIT © [paulwongx](https://github.com/paulwongx)
