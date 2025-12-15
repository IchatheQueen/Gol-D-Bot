import { run as runCustomCmdMigration } from './migrations/create_ccmd_tables';
import { run as runPhase2Migration } from './migrations/create_phase2_tables';
import { run as runCustomRoleMigration } from './migrations/create_custom_role_tables';
import { run as runCustomRoleMigration } from './migrations/create_custom_role_tables';
import { run as runRecruitMigration } from './migrations/create_recruit_tables';
import { run as runClanMigration } from './migrations/create_clan_tables';
import { run as runAchievementMigration } from './migrations/create_achievement_tables';
import { run as runPremiumMigration } from './migrations/add_premium_column';
import { run as runGeneratorMigration } from './migrations/create_generators';

// Turso connection - uses environment variables
// TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:./slotbot.db',  // Falls back to local file for dev
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize tables
export async function initDatabase() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            balance TEXT DEFAULT '0',
            vault TEXT DEFAULT '0',
            pills INTEGER DEFAULT 0,
            credits TEXT DEFAULT '0',
            selected_weapon TEXT DEFAULT 'pistol',
            selected_arrow TEXT DEFAULT 'arrow_normal'
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS inventory (
            user_id TEXT,
            item_id TEXT,
            amount TEXT DEFAULT '0',
            PRIMARY KEY (user_id, item_id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS cooldowns (
            user_id TEXT,
            command TEXT,
            timestamp INTEGER,
            PRIMARY KEY (user_id, command)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS pets (
            user_id TEXT PRIMARY KEY,
            name TEXT DEFAULT 'Cat',
            health INTEGER DEFAULT 1000,
            max_health INTEGER DEFAULT 1000,
            hunger INTEGER DEFAULT 100,
            thirst INTEGER DEFAULT 100,
            energy INTEGER DEFAULT 100,
            happiness INTEGER DEFAULT 100,
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            credits INTEGER DEFAULT 0,
            strength INTEGER DEFAULT 1,
            agility INTEGER DEFAULT 1,
            intellect INTEGER DEFAULT 1,
            endurance INTEGER DEFAULT 1,
            metabolism INTEGER DEFAULT 1,
            protection INTEGER DEFAULT 0,
            target_item TEXT DEFAULT 'balance',
            is_attacking INTEGER DEFAULT 0
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS stuns (
            user_id TEXT PRIMARY KEY,
            expires_at INTEGER,
            reason TEXT,
            issued_by TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS blacklist (
            user_id TEXT PRIMARY KEY,
            reason TEXT,
            timestamp INTEGER
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS drug_effects (
            user_id TEXT,
            drug_type TEXT,
            expires_at INTEGER,
            PRIMARY KEY (user_id, drug_type)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS stocks (
            user_id TEXT,
            stock_type INTEGER,
            shares TEXT DEFAULT '0',
            PRIMARY KEY (user_id, stock_type)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_colors (
            user_id TEXT PRIMARY KEY,
            color INTEGER DEFAULT 16777215
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS wallet_drops (
            channel_id TEXT PRIMARY KEY,
            amount TEXT,
            timestamp INTEGER,
            claimed_by TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS emoji_overrides (
            key TEXT PRIMARY KEY,
            emoji TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS command_aliases (
            alias_name TEXT PRIMARY KEY,
            target_command TEXT NOT NULL,
            arguments TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_skins (
            user_id TEXT,
            skin_id INTEGER,
            PRIMARY KEY (user_id, skin_id)
        )
    `);

    // Generators Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS generators (
            user_id TEXT PRIMARY KEY,
            level INTEGER DEFAULT 1,
            slots INTEGER DEFAULT 1,
            production_rate INTEGER DEFAULT 1,
            storage_capacity INTEGER DEFAULT 100,
            last_collection INTEGER DEFAULT 0
        )
    `);

    await runCustomCmdMigration();
    await runPhase2Migration();
    await runCustomRoleMigration();
    await runRecruitMigration();
    await runClanMigration();
    await runClanMigration();
    await runAchievementMigration();
    await runPremiumMigration();
    await runGeneratorMigration();

    // Custom Command Ownership
    await db.execute(`
        CREATE TABLE IF NOT EXISTS custom_command_ownership (
            command_name TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS custom_command_access (
            command_name TEXT,
            user_id TEXT,
            access_type TEXT, -- 'owner', 'co_owner', 'access'
            PRIMARY KEY (command_name, user_id)
        )
    `);

    // Migration: Add skin_id and last_updated to pets if not exists
    const migrations = [
        'ALTER TABLE pets ADD COLUMN skin_id INTEGER DEFAULT 0',
        'ALTER TABLE pets ADD COLUMN last_updated INTEGER DEFAULT 0',
        'ALTER TABLE pets ADD COLUMN max_health INTEGER DEFAULT 1000',
        'ALTER TABLE pets ADD COLUMN thirst INTEGER DEFAULT 100',
        'ALTER TABLE pets ADD COLUMN energy INTEGER DEFAULT 100',
        'ALTER TABLE pets ADD COLUMN experience INTEGER DEFAULT 0',
        'ALTER TABLE pets ADD COLUMN credits INTEGER DEFAULT 0',
        'ALTER TABLE pets ADD COLUMN strength INTEGER DEFAULT 1',
        'ALTER TABLE pets ADD COLUMN agility INTEGER DEFAULT 1',
        'ALTER TABLE pets ADD COLUMN intellect INTEGER DEFAULT 1',
        'ALTER TABLE pets ADD COLUMN endurance INTEGER DEFAULT 1',
        'ALTER TABLE pets ADD COLUMN metabolism INTEGER DEFAULT 1',
        'ALTER TABLE pets ADD COLUMN protection INTEGER DEFAULT 0',
        'ALTER TABLE pets ADD COLUMN target_item TEXT DEFAULT "balance"',
        'ALTER TABLE pets ADD COLUMN is_attacking INTEGER DEFAULT 0',
        'ALTER TABLE users ADD COLUMN pills INTEGER DEFAULT 0'
    ];

    for (const query of migrations) {
        try {
            await db.execute(query);
        } catch (e) {
            // Likely column exists error, ignore
        }
    }

    console.log('Database tables initialized!');
}

export default db;
