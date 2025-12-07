
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { execute } from "@/lib/db";
import { formatBigNumber } from "@/lib/bigNumbers";
import { GET } from "../api/auth/[...nextauth]/route";

async function getUserStats(discordId: string) {
    // Fetch user balance
    const userRes = await execute("SELECT * FROM users WHERE id = ?", [discordId]);
    const user = userRes.rows[0] as any || { balance: '0', bank: '0' };

    // Fetch pet
    const petRes = await execute("SELECT * FROM pets WHERE user_id = ?", [discordId]);
    const pet = petRes.rows[0] as any;

    return { user, pet };
}

export default async function DashboardPage() {
    const session = await getServerSession(GET);

    if (!session || !session.user) {
        redirect("/api/auth/signin?callbackUrl=/dashboard");
    }

    const { user, pet } = await getUserStats((session.user as any).id);

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Dashboard for {session.user.name}</h1>

            <div className="stat-grid">
                <div className="card">
                    <h2>Economy</h2>
                    <div className="stat-item">
                        <div className="stat-label">Wallet Balance</div>
                        <div className="stat-value">${formatBigNumber(user.balance || 0)}</div>
                    </div>
                    <div className="stat-item" style={{ marginTop: '1rem' }}>
                        <div className="stat-label">Bank Balance</div>
                        <div className="stat-value">${formatBigNumber(user.bank || 0)}</div>
                    </div>
                </div>

                <div className="card">
                    <h2>Pet Stats</h2>
                    {pet ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>{pet.name}</strong> (Lvl {pet.level})
                            </div>
                            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="stat-item">
                                    <div className="stat-label">Health</div>
                                    <div className="stat-value">{pet.health}/{pet.max_health}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">Energy</div>
                                    <div className="stat-value">{pet.energy}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">Hunger</div>
                                    <div className="stat-value">{pet.hunger}%</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">Mood</div>
                                    <div className="stat-value">{pet.happiness}%</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p>You don't have a pet yet! Use <code>~cat</code> in Discord.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
