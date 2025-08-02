import { db } from "../client";
import { sql } from "drizzle-orm";

// From root directory
// bun dotenv -e .env.test tsx ./packages/db/src/postgres/scripts/check-db-connection.ts

// From app directory
// bun dotenv -e ../../.env.dev tsx ../../packages/db/src/postgres/scripts/check-db-connection.ts

async function main() {
	try {
		const version = await db.execute(sql`SELECT version() AS VERSION`);
		console.log(version);

		// Perform a simple query to check the database health
		// await db.run(sql`SELECT 1`);
		console.log({ status: "ok", timestamp: new Date().toISOString() }, 200);
	} catch (error) {
		console.log(
			{
				status: "error",
				message: "Database connection failed",
				timestamp: new Date().toISOString(),
			},
			500
		);
	}
}

main();
