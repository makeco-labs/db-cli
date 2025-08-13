import * as esbuild from 'esbuild';
import pkg from './package.json' with { type: 'json' };

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

// Build the main CLI binary
esbuild.buildSync({
  entryPoints: ['./src/cli.ts'],
  bundle: true,
  outfile: 'dist/cli.cjs',
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  define: {
    'process.env.DB_CLI_VERSION': `"${pkg.version}"`,
    // Fix import.meta issue in CJS
    'import.meta.url': '""',
  },
  external: ['esbuild', 'drizzle-orm', 'drizzle-kit', ...driversPackages],
});

// Build the index file for programmatic usage
esbuild.buildSync({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  external: ['esbuild', 'drizzle-orm', 'drizzle-kit', ...driversPackages],
});

// Build ESM version
esbuild.buildSync({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outfile: 'dist/index.mjs',
  format: 'esm',
  target: 'node16',
  platform: 'node',
  external: ['esbuild', 'drizzle-orm', 'drizzle-kit', ...driversPackages],
});

console.log('✅ Build completed successfully');
