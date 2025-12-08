
import db from '../src/database/db';

const ADMIN_ID = '1331780893995565148';

async function register() {
    console.log('Registering custom commands...');

    // 1. Waifubal (Skin for Balance)
    // Alias: waifubal -> balance
    // Owner: Admin
    await registerCommand('waifubal', 'balance', '', ADMIN_ID);
    // Note: 'waifubal' skin logic is hardcoded in balance.ts checking for 'waifubal' skin name.
    // For the user to "use" it as `~waifubal`, the alias should point to balance, AND we probably need to ensure `~skin waifubal balance` works?
    // With `ccmd`, giving access allows them to USE it? 
    // Usually, having "access" means you can EQUIP it.
    // Let's assume the alias alone triggers the "skin" lookup if we modify `balance.ts` to check alias?
    // Actually `balance.ts` checks `user_command_skins` table. 
    // To ANYONE using `~waifubal` needs to have `user_command_skins` set to waifubal? 
    // OR does `~waifubal` alias automatically apply the skin?
    // The current alias system allows arguments. defined in `command_aliases`.
    // But `balance.ts` ignores args for skin selection, it looks at DB.
    // This is fine. The request implies ownership. 

    // 2. Kitty (Skin for Cat)
    // Alias: kitty -> cat
    // Owner: Admin
    // We also need to map this 'custom command' to the actual Skin ID in `catSkins.ts`.
    // There is no direct link between "custom command name" and "skin id" in the DB yet, except manual mapping.
    // User requested "list ... as custom command".
    await registerCommand('kitty', 'cat', '', ADMIN_ID);

    // 3. Gooner (Skin for Cat)
    await registerCommand('gooner', 'cat', '', ADMIN_ID);

    // 4. Warrior Cat
    await registerCommand('warrior', 'cat', '', ADMIN_ID); // naming it 'warrior' for simplicity, or 'arrior cat' as requested? 'arrior cat' has a space, bad for alias. Assuming 'warrior'.

    // Wait, the user said "arrior cat". I'll register 'warrior' as the command key.

    console.log('Registration complete.');
}

async function registerCommand(alias: string, target: string, args: string, ownerId: string) {
    try {
        // 1. Add to command_aliases
        await db.execute({
            sql: `INSERT OR REPLACE INTO command_aliases (alias_name, target_command, arguments) VALUES (?, ?, ?)`,
            args: [alias, target, args]
        });
        console.log(`Registered alias: ${alias} -> ${target}`);

        // 2. Add to custom_command_ownership
        await db.execute({
            sql: `INSERT OR REPLACE INTO custom_command_ownership (command_name, owner_id) VALUES (?, ?)`,
            args: [alias, ownerId]
        });
        console.log(`Registered ownership: ${alias} -> ${ownerId}`);

        // 3. Grant owner access to themselves
        await db.execute({
            sql: `INSERT OR REPLACE INTO custom_command_access (command_name, user_id, access_type) VALUES (?, ?, 'owner')`,
            args: [alias, ownerId]
        });

    } catch (e) {
        console.error(`Failed to register ${alias}:`, e);
    }
}

register();
