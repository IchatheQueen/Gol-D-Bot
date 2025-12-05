import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../slotbot.db');
const db = new Database(dbPath);

// Add missing columns to users table
try {
    db.exec(`ALTER TABLE users ADD COLUMN selected_weapon TEXT DEFAULT 'pistol'`);
    console.log('Added selected_weapon column');
} catch (e) {
    // Column already exists
}

try {
    db.exec(`ALTER TABLE users ADD COLUMN selected_arrow TEXT DEFAULT 'arrow_normal'`);
    console.log('Added selected_arrow column');
} catch (e) {
    // Column already exists
}

console.log('Migration complete!');
db.close();
