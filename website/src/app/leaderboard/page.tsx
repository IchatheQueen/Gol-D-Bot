import { db } from "../../lib/db";
import { formatBigNumber } from "../../lib/utils";

export const revalidate = 60; // Revalidate every minute

/** Matches the bot's `~settings lb` display exactly. */
const HIDDEN_NAME = "[User Hidden]";

export default async function Leaderboard() {
    // Balances are stored as TEXT, so they cannot be compared numerically with
    // a CAST — the values run to hundreds of digits and overflow. Ordering by
    // length first and then lexically is correct for the plain digit strings
    // the bot writes.
    //
    // The join carries the user's `lb_anon` opt-out. Users who set it via
    // `~settings lb` are promised they appear as [User Hidden] on leaderboards,
    // and this page has to honour that the same way `~top` and `~cat lb` do.
    const result = await db.execute({
        sql: `SELECT u.id, u.balance, u.vault, u.credits,
                     COALESCE(s.lb_anon, 0) AS lb_anon
              FROM users u
              LEFT JOIN user_settings s ON s.user_id = u.id
              ORDER BY length(u.balance) DESC, u.balance DESC
              LIMIT 100`,
        args: []
    });

    const users = result.rows as any[];

    return (
        <div>
            <h1 style={{ color: 'var(--primary)', marginBottom: '2rem', textAlign: 'center' }}>🏆 Leaderboard</h1>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>#</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>User ID</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Balance</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Vault</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Credits</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => {
                            const hidden = Number(user.lb_anon) === 1;
                            return (
                            // Hidden users are keyed by rank so their id never
                            // reaches the client, even as a React key.
                            <tr key={hidden ? `hidden-${index}` : user.id} className="thread-item">
                                <td style={{ padding: '1rem' }}>{index + 1}</td>
                                <td style={{ padding: '1rem', color: hidden ? 'var(--text-muted)' : undefined }}>
                                    {hidden ? HIDDEN_NAME : user.id}
                                </td>
                                <td style={{ padding: '1rem', color: '#4caf50' }}>${formatBigNumber(user.balance)}</td>
                                <td style={{ padding: '1rem', color: '#2196f3' }}>${formatBigNumber(user.vault)}</td>
                                <td style={{ padding: '1rem', color: '#9c27b0' }}>💎 {formatBigNumber(user.credits)}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
