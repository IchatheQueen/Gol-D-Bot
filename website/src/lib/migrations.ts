
import { db } from './db';

const schema = `
CREATE TABLE IF NOT EXISTS forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    author_id TEXT, -- Discord ID
    author_name TEXT,
    title TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY(category_id) REFERENCES forum_categories(id)
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER,
    author_id TEXT, -- Discord ID
    author_name TEXT,
    content TEXT,
    created_at INTEGER,
    FOREIGN KEY(thread_id) REFERENCES forum_threads(id)
);

-- Seed Categories if empty
INSERT OR IGNORE INTO forum_categories (id, name, description, order_index) VALUES 
(1, 'General Discussion', 'Talk about anything related to GoldBot', 1),
(2, 'Trading', 'Buy, sell, and trade items', 2),
(3, 'Suggestions', 'Have an idea? Share it here!', 3);
`;

export async function migrate() {
    console.log('Running migrations...');
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
        await db.execute(stmt);
    }
    console.log('Migrations complete.');
}
