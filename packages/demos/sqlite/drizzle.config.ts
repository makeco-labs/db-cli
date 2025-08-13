import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.DATABASE_URL;

// if (!dbUrl) {
//   throw new Error('DATABASE_URL is not set');
// }

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: dbUrl || "",
  },
});
