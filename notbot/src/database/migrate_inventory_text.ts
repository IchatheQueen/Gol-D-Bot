import db from './db';

console.log('Migrating inventory columns to TEXT...');

const migrate = async () => {
    try {
        await db.execute('BEGIN TRANSACTION');

        // 1. Rename inventory to inventory_old
        await db.execute('ALTER TABLE inventory RENAME TO inventory_old');

        // 2. Create new inventory table with TEXT for amount
        await db.execute(`
            CREATE TABLE inventory (
                user_id TEXT,
                item_id TEXT,
                amount TEXT DEFAULT '0',
                PRIMARY KEY (user_id, item_id)
            )
        `);

        // 3. Copy data
        await db.execute(`
            INSERT INTO inventory (user_id, item_id, amount)
            SELECT user_id, item_id, CAST(amount AS TEXT)
            FROM inventory_old
        `);

        // 4. Drop old table
        await db.execute('DROP TABLE inventory_old');

        await db.execute('COMMIT');
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
        await db.execute('ROLLBACK');
    }
};

migrate();
