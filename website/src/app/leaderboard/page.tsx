import { db } from "../../lib/db";
import { formatBigNumber } from "../../lib/utils";

export const revalidate = 60; // Revalidate every minute

export default async function Leaderboard() {
    const result = await db.execute({
        sql: "SELECT id, balance, vault, credits FROM users ORDER BY CAST(balance AS INTEGER) DESC LIMIT 100",
        args: [],
    });
    // Note: CAST(balance AS INTEGER) might be risky for HUGE numbers in SQLite if stored as text. 
    // But Turso/libSQL treats text comparisons for sorting if not cast? 
    // In bot `rank.ts`, we fetch all and sort in JS because of BigInt.
    // Ideally we should sort in SQL. stored as TEXT.
    // `ORDER BY length(balance) DESC, balance DESC` works for positive integers stored as text!

    const optimizedResult = await db.execute({
        sql: "SELECT id, balance, vault, credits FROM users ORDER BY length(balance) DESC, balance DESC LIMIT 100",
        args: []
    });

    const users = optimizedResult.rows as any[];

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
                        {users.map((user, index) => (
                            <tr key={user.id} className="thread-item">
                                <td style={{ padding: '1rem' }}>{index + 1}</td>
                                <td style={{ padding: '1rem' }}>{user.id}</td>
                                <td style={{ padding: '1rem', color: '#4caf50' }}>${formatBigNumber(user.balance)}</td>
                                <td style={{ padding: '1rem', color: '#2196f3' }}>${formatBigNumber(user.vault)}</td>
                                <td style={{ padding: '1rem', color: '#9c27b0' }}>💎 {formatBigNumber(user.credits)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
