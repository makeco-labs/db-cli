import "dotenv/config";
import { sql } from "drizzle-orm";

import { db } from "../client";

// Function to get all tables in the database
async function getTables() {
	const statement = sql`SELECT name FROM sqlite_master WHERE type='table'`;
	const tables = db.all(statement); // Using db.all() to fetch all tables
	return tables.map((row: any) => row.name); // Extract table names
}

// Function to reset the schema (drop all tables)
async function resetSchema() {
	try {
		// Turn off foreign key checks
		db.run(sql`PRAGMA foreign_keys = OFF`);
		console.log("Foreign keys disabled");

		const tables = await getTables(); // Get all table names
		for (const table of tables) {
			const deleteStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`;
			db.run(deleteStatement); // Drop each table
			console.log(`Dropped table: ${table}`);
		}

		// Turn foreign key checks back on
		db.run(sql`PRAGMA foreign_keys = ON`);
		console.log("Foreign keys enabled");

		process.exit(0);
	} catch (e) {
		console.error("Error resetting schema:", e);
		process.exit(1);
	}
}

resetSchema();
