
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
      </body>
    </html>
  );
}
