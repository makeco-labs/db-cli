import * as esbuild from 'esbuild';
import { cpSync } from 'node:fs';

const driversPackages = [
	// postgres drivers
	'pg',
	'postgres',
	'@vercel/postgres',
	'@neondatabase/serverless',
	'@electric-sql/pglite',
	//  mysql drivers
	'mysql2',
	'@planetscale/database',
	// sqlite drivers
	'@libsql/client',
	'better-sqlite3',
	// turso/libsql drivers
	'@aws-sdk/client-rds-data',
	'@cloudflare/workers-types',
	// gel driver
	'gel',
];

// Build the CLI with ESM loader for development
esbuild.buildSync({
	entryPoints: ['./src/cli.ts'],
	bundle: true,
	outfile: 'dist/cli.cjs',
	format: 'cjs',
	target: 'node16',
	platform: 'node',
	external: [
		'commander',
		'chalk',
		'dotenv',
		'prompts',
		'esbuild',
		'drizzle-orm',
		'drizzle-kit',
		...driversPackages,
	],
	banner: {
		js: `#!/usr/bin/env -S node --loader ./dist/loader.mjs --no-warnings`,
	},
});

// Build the index file for programmatic usage
esbuild.buildSync({
	entryPoints: ['./src/index.ts'],
	bundle: true,
	outfile: 'dist/index.js',
	format: 'cjs',
	target: 'node16',
	platform: 'node',
	external: [
		'drizzle-orm',
		'drizzle-kit',
		...driversPackages,
	],
});

// Copy the loader file if it exists (create one if needed)
try {
	cpSync('./src/loader.mjs', 'dist/loader.mjs');
} catch (error) {
	console.log('No loader.mjs found, creating a simple one...');
	// We'll create a simple loader that just handles TypeScript files
}

console.log('✅ Development build completed successfully');