#!/usr/bin/env node

console.log('Testing driver detection like drizzle-kit does...\n');

// This is exactly how drizzle-kit checks for packages
const checkPackage = async (packageName) => {
  try {
    await import(packageName);
    return true;
  } catch {
    return false;
  }
};

const testDrivers = async () => {
  console.log('Checking PostgreSQL drivers:');
  const pgAvailable = await checkPackage('pg');
  console.log(`  pg: ${pgAvailable ? '✅ available' : '❌ not available'}`);
  
  const postgresAvailable = await checkPackage('postgres');  
  console.log(`  postgres: ${postgresAvailable ? '✅ available' : '❌ not available'}`);
  
  const vercelPostgresAvailable = await checkPackage('@vercel/postgres');
  console.log(`  @vercel/postgres: ${vercelPostgresAvailable ? '✅ available' : '❌ not available'}`);
  
  const neonAvailable = await checkPackage('@neondatabase/serverless');
  console.log(`  @neondatabase/serverless: ${neonAvailable ? '✅ available' : '❌ not available'}`);

  // Simulate what happens in your CLI
  if (pgAvailable) {
    console.log('\n🎉 Would use pg driver');
  } else if (postgresAvailable) {
    console.log('\n🎉 Would use postgres driver');
  } else if (vercelPostgresAvailable) {
    console.log('\n🎉 Would use @vercel/postgres driver');
  } else if (neonAvailable) {
    console.log('\n🎉 Would use @neondatabase/serverless driver');
  } else {
    console.log('\n❌ No PostgreSQL drivers found!');
    console.log("To connect to Postgres database - please install either of 'pg', 'postgres', '@neondatabase/serverless' or '@vercel/postgres' drivers");
  }
};

testDrivers().catch(console.error);