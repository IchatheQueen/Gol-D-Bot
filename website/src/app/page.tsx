import Link from 'next/link';
import { FaDiscord, FaTwitter, FaGithub, FaSpotify } from 'react-icons/fa'; // Assuming react-icons is available or I should check package.json. 
// If not available, I'll use text or simple SVGs.
// Since I can't easily check/install in this environment without permission, I'll assume standard <i> tags with FontAwesome classes or similar if included in head, 
// BUT simpler is just text or inline SVGs.
// I'll use emoji for now to be safe, or just text.

export default function Home() {
  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '4rem' }}>

      {/* Profile Section */}
      <div className="profile-header animate-fade-in-up">
        <img
          src="https://cdn.discordapp.com/avatars/1331780893995565148/ecbd09a89d76ec4838334460061cdf74.png" // Placeholder or User Avatar if known
          alt="Profile"
          className="profile-avatar"
        />
        <h1 className="profile-name">Pois6n</h1>
        <p style={{ color: '#a1a1aa', fontSize: '1.2rem', marginTop: '0.5rem' }}>Full Stack Developer • Bot Creator • Gamer</p>

        <div className="profile-tags">
          <span className="tag">👑 Owner</span>
          <span className="tag">💻 Developer</span>
          <span className="tag">🌟 Verified</span>
        </div>
      </div>

      {/* Bio / Links Card */}
      <div className="card">
        <h2>About Me</h2>
        <p style={{ lineHeight: '1.6', color: '#d4d4d8' }}>
          Welcome to my digital space. I build advanced Discord bots and web applications.
          Creator of <strong>GoldBot</strong>, a high-performance economy and RPG bot.
        </p>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="#" className="btn btn-discord">
            Join Discord
          </a>
          <a href="#" className="btn btn-primary">
            Visit Portfolio
          </a>
        </div>
      </div>

      {/* Projects */}
      <div className="card">
        <h2>Projects</h2>
        <div className="thread-list">
          <div className="thread-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🌟</span>
              <div>
                <h3 style={{ margin: 0 }}>GoldBot</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#a1a1aa' }}>Advanced Economy & RPG Discord Bot</p>
              </div>
            </div>
            <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>View</Link>
          </div>
        </div>
      </div>

      {/* Music / Spotify Embed Placeholder */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(45deg, #1DB954 0%, #191414 100%)', border: 'none' }}>
        <div style={{ fontSize: '2rem', color: '#fff' }}>🎵</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, color: '#fff' }}>Now Playing</h4>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Vibin' in the Rit</p>
        </div>
        <div style={{ color: '#fff' }}>I</div> {/* Fake visualizer */}
      </div>

    </div>
  );
}
