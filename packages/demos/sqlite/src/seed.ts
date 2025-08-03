import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, posts, comments } from './schema';

/**
 * Seeds the SQLite database with initial data
 */
export default async function seed() {
  console.log('🌱 Seeding SQLite database...');

  // Create database connection
  const sqlite = new Database(process.env.DATABASE_URL || './dev.db');
  const db = drizzle(sqlite, {
    schema: { users, posts, comments }
  });

  // Insert initial users
  const insertedUsers = await db.insert(users).values([
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      isActive: true,
    },
    {
      name: 'Bob Chen',
      email: 'bob@example.com',
      isActive: true,
    },
    {
      name: 'Carol Davis',
      email: 'carol@example.com',
      isActive: false,
    },
  ]).returning();

  console.log(`✅ Inserted ${insertedUsers.length} users`);

  // Insert initial posts
  const insertedPosts = await db.insert(posts).values([
    {
      title: 'SQLite Performance Tips',
      content: 'Learn how to optimize your SQLite database for better performance.',
      authorId: insertedUsers[0].id,
      publishedAt: new Date(),
    },
    {
      title: 'Database Migrations Made Easy',
      content: 'A comprehensive guide to managing database schema changes.',
      authorId: insertedUsers[1].id,
      publishedAt: new Date(),
    },
    {
      title: 'Local Development with SQLite',
      content: 'Why SQLite is perfect for local development and testing.',
      authorId: insertedUsers[0].id,
      publishedAt: new Date(),
    },
    {
      title: 'Draft: Future SQLite Features',
      content: 'Exploring upcoming SQLite features and improvements.',
      authorId: insertedUsers[2].id,
      publishedAt: null, // Draft post
    },
  ]).returning();

  console.log(`✅ Inserted ${insertedPosts.length} posts`);

  // Insert initial comments
  const insertedComments = await db.insert(comments).values([
    {
      content: 'Excellent tips! My queries are much faster now.',
      postId: insertedPosts[0].id,
      authorId: insertedUsers[1].id,
    },
    {
      content: 'Could you share some specific indexing strategies?',
      postId: insertedPosts[0].id,
      authorId: insertedUsers[2].id,
    },
    {
      content: 'This saved me hours of work. Thank you!',
      postId: insertedPosts[1].id,
      authorId: insertedUsers[0].id,
    },
    {
      content: 'Great point about SQLite for local dev. No setup required!',
      postId: insertedPosts[2].id,
      authorId: insertedUsers[1].id,
    },
    {
      content: 'Looking forward to the final version of this post.',
      postId: insertedPosts[3].id,
      authorId: insertedUsers[0].id,
    },
  ]).returning();

  console.log(`✅ Inserted ${insertedComments.length} comments`);
  console.log('🎉 SQLite database seeding completed successfully!');

  // Close database connection
  sqlite.close();
}