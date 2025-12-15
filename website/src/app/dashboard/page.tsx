import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../lib/db";
import { formatBigNumber } from "../../lib/utils";
import Link from "next/link";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const userId = (session.user as any).id;

    // Fetch User Data
    const userResult = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [userId],
    });
    const user = userResult.rows[0] as any;

    // Fetch Pet Data
    const petResult = await db.execute({
        sql: "SELECT * FROM pets WHERE user_id = ?",
        args: [userId],
    });
    const pet = petResult.rows[0] as any;

    if (!user) {
        // New user or not in bot DB?
        return (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <h1>Welcome, {session.user.name}!</h1>
                <p>It seems you haven't started your journey with GoldBot yet.</p>
                <p>Go to Discord and use <code>~start</code> (or any command) to register!</p>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Dashboard</h1>

            {/* User Stats Card */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    {session.user.image && <img src={session.user.image} style={{ borderRadius: '50%', width: '64px' }} />}
                    <div>
                        <h2 style={{ border: 'none', marginBottom: '0' }}>{session.user.name}</h2>
                        <span style={{ color: 'var(--text-muted)' }}>User ID: {userId}</span>
                    </div>
                </div>

                <div className="stat-grid">
                    <div className="stat-item">
                        <div className="stat-label">Balance</div>
                        <div className="stat-value" style={{ color: '#4caf50' }}>${formatBigNumber(user.balance)}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Vault</div>
                        <div className="stat-value" style={{ color: '#2196f3' }}>${formatBigNumber(user.vault)}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Credits</div>
                        <div className="stat-value" style={{ color: '#9c27b0' }}>💎 {formatBigNumber(user.credits)}</div>
                    </div>
                </div>
            </div>

            {/* Pet Card */}
            {pet ? (
                <div className="card">
                    <h2>Your Pet: {pet.name}</h2>
                    <div className="stat-grid">
                        <div className="stat-item">
                            <div className="stat-label">Level</div>
                            <div className="stat-value">{pet.level}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Health</div>
                            <div className="stat-value" style={{ color: '#f44336' }}>{pet.health}/{pet.max_health}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Energy</div>
                            <div className="stat-value" style={{ color: '#ff9800' }}>{pet.energy}/100</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <h2>Your Pet</h2>
                    <p>You don't have a pet yet! Use <code>~cat</code> in Discord to adopt one.</p>
                </div>
            )}

            {/* Inventory Link */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link href="/inventory" className="btn btn-primary">View Inventory</Link>
            </div>

        </div>
    );
}
