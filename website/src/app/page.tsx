
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}>Welcome to GoldBot Web</h1>
      <p style={{ fontSize: '1.2rem', color: '#b9bbbe', maxWidth: '600px', margin: '0 auto 2rem' }}>
        The ultimate companion for your Discord adventure. Manage your inventory, check your stats, and discuss strategies in the forums.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '1.2rem' }}>
          Dashboard
        </Link>
        <Link href="/api/auth/signin" className="btn btn-discord" style={{ fontSize: '1.2rem' }}>
          Login
        </Link>
        <Link href="/forums" className="btn btn-discord" style={{ fontSize: '1.2rem' }}>
          Forums
        </Link>
      </div>

      <div className="card" style={{ marginTop: '4rem', textAlign: 'left' }}>
        <h2>Latest News</h2>
        <p>GoldBot Web is currently under construction. More features coming soon!</p>
      </div>
    </div>
  );
}
