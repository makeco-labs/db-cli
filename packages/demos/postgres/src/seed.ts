import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, posts, comments } from './schema';

/**
 * Seeds the PostgreSQL database with initial data
 */
export default async function seed() {
  console.log('🌱 Seeding PostgreSQL database...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create database connection
  const pool = new Pool({
    connectionString,
  });

  const db = drizzle(pool, {
    schema: { users, posts, comments },
  });

  // Insert initial users
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true,
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        isActive: true,
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        isActive: false,
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedUsers.length} users`);

  // Insert initial posts
  const insertedPosts = await db
    .insert(posts)
    .values([
      {
        title: 'Welcome to Our Blog',
        content: 'This is our first blog post. Welcome to our community!',
        authorId: insertedUsers[0].id,
        publishedAt: new Date(),
      },
      {
        title: 'Getting Started with Database Seeding',
        content:
          'Learn how to use db-cli to seed your database with initial data.',
        authorId: insertedUsers[1].id,
        publishedAt: new Date(),
      },
      {
        title: 'Advanced PostgreSQL Features',
        content:
          'Exploring advanced PostgreSQL features for modern applications.',
        authorId: insertedUsers[0].id,
        publishedAt: new Date(),
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedPosts.length} posts`);

  // Insert initial comments
  const insertedComments = await db
    .insert(comments)
    .values([
      {
        content: 'Great post! Very helpful information.',
        postId: insertedPosts[0].id,
        authorId: insertedUsers[1].id,
      },
      {
        content: 'Thanks for sharing this. Looking forward to more content.',
        postId: insertedPosts[0].id,
        authorId: insertedUsers[2].id,
      },
      {
        content: 'This tutorial was exactly what I needed!',
        postId: insertedPosts[1].id,
        authorId: insertedUsers[0].id,
      },
      {
        content: 'Could you explain more about foreign key relationships?',
        postId: insertedPosts[1].id,
        authorId: insertedUsers[2].id,
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedComments.length} comments`);
  console.log('🎉 Database seeding completed successfully!');

  // Close database connection
  await pool.end();
}
