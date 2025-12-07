
import { migrate } from "@/lib/migrations";

export default async function ForumsPage() {
    // Run migration on page load (dev only/simple setup)
    // Ideally this is a separate script, but for now this ensures tables exist
    await migrate();

    // Fetch categories (would be import from db)
    const { execute } = await import("@/lib/db");
    const res = await execute("SELECT * FROM forum_categories ORDER BY order_index ASC");
    const categories = res.rows as any[];

    return (
        <div>
            <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>GoldBot Forums</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Welcome to the community forums.</p>

            <div className="category-list">
                {categories.map((cat) => (
                    <div key={cat.id} className="card forum-category">
                        <h2>{cat.name}</h2>
                        <p>{cat.description}</p>
                        {/* Link to category/threads page */}
                        <a href={`/forums/${cat.id}`} className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            View Threads
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
