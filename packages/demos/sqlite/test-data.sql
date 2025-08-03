-- Sample data for testing the reset functionality

INSERT INTO users (name, email) VALUES 
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com'),
  ('Bob Wilson', 'bob@example.com');

INSERT INTO posts (title, content, author_id, published_at) VALUES 
  ('First Post', 'This is my first blog post!', 1, CURRENT_TIMESTAMP),
  ('SQLite Tips', 'Here are some useful SQLite tips...', 2, CURRENT_TIMESTAMP),
  ('Drizzle ORM Guide', 'Getting started with Drizzle ORM', 1, CURRENT_TIMESTAMP);

INSERT INTO comments (content, post_id, author_id) VALUES 
  ('Great post!', 1, 2),
  ('Thanks for sharing', 1, 3),
  ('Very helpful tips', 2, 1),
  ('Looking forward to more posts', 3, 2);