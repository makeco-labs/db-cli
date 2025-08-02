import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../client";

const tableAllowlist = [
	"pg_toast",
	"migrations",
	"drizzle_migrations",
	"drizzle_query_log",
	"drizzle_query_log_entries",
];

const schemaAllowlist = [
	"information_schema",
	"pg_catalog",
	"pg_toast",
	"public",
];

// Function to get all tables in the database
async function getTables() {
	const statement = sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
	const tables = await db.execute(statement);
	return tables
		.map((row: any) => row.table_name)
		.filter(table => !tableAllowlist.includes(table));
}

// Function to get all schemas in the database
async function getSchemas() {
	const statement = sql`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
  `;
	const schemas = await db.execute(statement);
	return schemas
		.map((row: any) => row.schema_name)
		.filter(schema => !schemaAllowlist.includes(schema));
}

// Function to reset the schema (drop all tables and schemas)
async function resetSchema() {
	try {
		const tables = await getTables();
		console.log("Tables to drop:", tables.join(", "));
		for (const table of tables) {
			const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE`;
			await db.execute(dropStatement);
			console.log(`Dropped table: ${table}`);
		}

		const schemas = await getSchemas();
		console.log("Schemas to drop:", schemas.join(", "));
		for (const schema of schemas) {
			if (schema !== "public") {
				const dropStatement = sql`DROP SCHEMA IF EXISTS ${sql.identifier(schema)} CASCADE`;
				await db.execute(dropStatement);
				console.log(`Dropped schema: ${schema}`);
			}
		}

		console.log("Schema reset completed");
		process.exit(0);
	} catch (e) {
		console.error("Error resetting schema:", e);
		process.exit(1);
	}
}

resetSchema();
