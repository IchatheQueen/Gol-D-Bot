import db from '../db';

/**
 * The tipped-arrow feature shipped with three incompatible id schemes:
 *   - briefcases granted a generic  'tipped_arrow'
 *   - ~tipped listed               'tipped_normal', 'tipped_nitro', ...
 *   - the selector wrote            'arrow_normal', 'arrow_slime', ...
 * so nothing a player earned was ever visible or equippable.
 *
 * Everything is now on the `tipped_` scheme. This moves existing rows over:
 * generic stacks become Normal, and equipped `arrow_*` values are remapped.
 */
const SELECTED_ARROW_MAP: Record<string, string> = {
    arrow_normal: 'tipped_normal',
    arrow_nitro: 'tipped_nitro',
    arrow_armorshred: 'tipped_armorshred',
    arrow_slime: 'tipped_slime',
    arrow_slow: 'tipped_slowness',
};

export async function run(): Promise<void> {
    try {
        // Fold any generic 'tipped_arrow' stacks into Normal, summing if the
        // player somehow holds both.
        const generic = await db.execute({
            sql: 'SELECT user_id, amount FROM inventory WHERE item_id = ?',
            args: ['tipped_arrow']
        });

        for (const row of generic.rows as any[]) {
            const userId = row.user_id as string;
            const existing = await db.execute({
                sql: 'SELECT amount FROM inventory WHERE user_id = ? AND item_id = ?',
                args: [userId, 'tipped_normal']
            });
            const current = existing.rows[0] ? BigInt((existing.rows[0] as any).amount) : 0n;
            const total = current + BigInt(row.amount as string);

            await db.execute({
                sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = ?',
                args: [userId, 'tipped_normal', total.toString(), total.toString()]
            });
        }

        await db.execute({ sql: 'DELETE FROM inventory WHERE item_id = ?', args: ['tipped_arrow'] });

        // Remap equipped arrows onto the surviving scheme.
        for (const [oldId, newId] of Object.entries(SELECTED_ARROW_MAP)) {
            await db.execute({
                sql: 'UPDATE users SET selected_arrow = ? WHERE selected_arrow = ?',
                args: [newId, oldId]
            });
        }

        if (generic.rows.length > 0) {
            console.log(`Migrated ${generic.rows.length} generic tipped_arrow stack(s) to tipped_normal.`);
        }
    } catch (e) {
        console.error('unify_tipped_arrows migration failed:', e);
    }
}
