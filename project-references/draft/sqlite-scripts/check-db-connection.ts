import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getConnection } from "../get-connection";
import Database from "better-sqlite3";

// From root directory
// bun dotenv -e .env.dev tsx ./packages/db/src/sqlite/scripts/version.ts

// From app directory
// bun dotenv -e ../../.env.dev tsx ../../packages/db/src/sqlite/scripts/version.ts

async function main() {
	// try {
	const databaseUrl = process.env.SQLITE_DATABASE_URL!;
	console.log({ databaseUrl });
	const sqlite = new Database(databaseUrl);
	// const db = drizzle(sqlite);

	// const db = getConnection(databaseUrl);

	// const version = db.run(sql`SELECT sqlite_version() AS VERSION`);
	// console.log(version);

	// Perform a simple query to check the database health
	// await db.run(sql`SELECT 1`);
	console.log({ status: "ok", timestamp: new Date().toISOString() }, 200);
	// } catch (error) {
	// 	console.log(
	// 		{
	// 			status: "error",
	// 			message: "Database connection failed",
	// 			timestamp: new Date().toISOString(),
	// 		},
	// 		500
	// 	);
	// }
}

main();
