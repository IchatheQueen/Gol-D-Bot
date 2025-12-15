
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GoldBot Web',
  description: 'Official dashboard and forums for GoldBot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="navbar">
          <Link href="/" className="logo">
            🌟 GoldBot
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/forums">Forums</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
        </nav>
        <main className="container">
          {children}
        </main>
        <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid #444', marginTop: 'auto', color: '#72767d' }}>
          <p>&copy; 2025 GoldBot. All rights reserved.</p>
          <div style={{ marginTop: '0.5rem' }}>
            <Link href="/terms" style={{ color: '#72767d', marginRight: '1rem' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ color: '#72767d' }}>Privacy Policy</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
