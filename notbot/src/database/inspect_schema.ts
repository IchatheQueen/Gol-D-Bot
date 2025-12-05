import db from './db';

async function inspect() {
    const result = await db.execute('PRAGMA table_info(users)');
    console.log(JSON.stringify(result.rows, null, 2));
}

inspect();
