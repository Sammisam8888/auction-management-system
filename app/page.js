import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing-page">
      <h1 className="landing-logo">KPL 2026</h1>
      <p className="landing-subtitle">Kratu Premier League — Auction</p>
      <div className="landing-buttons">
        <Link href="/display" className="landing-btn primary">
          📺 Public Display
        </Link>
        <Link href="/scorekeeper" className="landing-btn secondary">
          🎯 Scorekeeper
        </Link>
        <Link href="/statistics" className="landing-btn secondary">
          📊 Statistics
        </Link>
      </div>
    </div>
  );
}
