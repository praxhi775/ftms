import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ExternalLink, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Upload, 
  Download, 
  FileText, 
  UserPlus, 
  LayoutList,
  Bell
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Hero Welcome Card */}
      <section className="welcome-hero-card" aria-labelledby="welcome-heading">
        <div className="hero-header-row">
          <div className="hero-title-group">
            <h1 id="welcome-heading" className="hero-title">
              Welcome back, Coach
            </h1>
            <p className="hero-subtitle">
              Tactical board is synced, rosters are prepped, and pitch is cleared.
            </p>
          </div>
          
          <div className="squad-status-indicator desktop-status">
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-label">Squad Status: Pitch Ready</span>
          </div>
        </div>

        {/* Hero Dual Cards: Next Session & Directive */}
        <div className="hero-cards-grid">
          {/* Card 1: Primary Focus - Next Session */}
          <article className="session-card">
            <div className="card-top-bar">
              <span className="card-tag session-tag">
                PRIMARY FOCUS - NEXT SESSION
              </span>
              <span className="badge badge-green">
                Pitch A - Full Squad
              </span>
            </div>

            <div className="card-content-headline">
              <div className="icon-circle icon-circle-mint" aria-hidden="true">
                {/* Football / Soccer Pitch Icon */}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="soccer-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <h2 className="session-title">
                Saturday 09:30 AM
              </h2>
            </div>

            <p className="card-description session-description">
              Tactical drills &amp; 8v8 scrimmage scheduled. Check lineup readiness before kick-off.
            </p>

            <div className="card-footer session-footer">
              <MapPin size={14} className="location-icon" aria-hidden="true" />
              <span>North Training Pitch - Arrive 15m early</span>
            </div>
          </article>

          {/* Card 2: Required Directive - Update Status After Match */}
          <article className="directive-card">
            <div className="card-top-bar">
              <span className="card-tag directive-tag">
                REQUIRED DIRECTIVE
              </span>
              <span className="badge badge-peach">
                Pending Logs
              </span>
            </div>

            <div className="card-content-headline">
              <div className="icon-circle icon-circle-dark" aria-hidden="true">
                <Bell size={20} className="bell-icon" strokeWidth={2.4} />
              </div>
              <h2 className="directive-title">
                Update Status After Match
              </h2>
            </div>

            <p className="card-description directive-description">
              Don't forget to record attendance, match outcome, and player statuses after the final whistle to keep analytics calibrated.
            </p>

            <div className="card-footer directive-footer">
              <button
                type="button"
                className="btn-directive"
                onClick={() => navigate('/matches')}
                aria-label="Update Status Now on Matches page"
              >
                <span>Update Status Now</span>
                <ExternalLink size={13} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="link-direct-entry"
                onClick={() => navigate('/matches')}
              >
                Direct log entry
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Immediate Directives Section */}
      <section className="directives-section" aria-labelledby="immediate-directives-title">
        <div className="directives-header">
          <h2 id="immediate-directives-title" className="section-eyebrow">
            IMMEDIATE DIRECTIVES
          </h2>
          <span className="section-note">
            Pencil in tactics &amp; logs
          </span>
        </div>

        <div className="action-cards-grid">
          {/* Action Card 1: New Match */}
          <div
            className="action-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/matches')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/matches')}
            aria-label="Navigate to New match"
          >
            <div className="action-card-header">
              <div className="action-icon-circle action-mint" aria-hidden="true">
                {/* Whistle icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5.5a4.5 4.5 0 0 0-4.5 4.5v0a4.5 4.5 0 0 0 8.5 2.1l4-2.1a2 2 0 0 0 .5-3L18 5.5l-7 0Z" />
                  <path d="M15 9.5a1.5 1.5 0 1 0 3 0" />
                  <path d="M6.5 14.5 3 18" />
                </svg>
              </div>
              <Plus size={16} className="corner-icon" aria-hidden="true" />
            </div>
            <h3 className="action-card-title">New match</h3>
            <p className="action-card-desc">
              Pick squad &amp; generate balanced teams
            </p>
          </div>

          {/* Action Card 2: Add Player */}
          <div
            className="action-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/players')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/players')}
            aria-label="Navigate to Add player"
          >
            <div className="action-card-header">
              <div className="action-icon-circle action-peach" aria-hidden="true">
                <UserPlus size={19} strokeWidth={2.2} />
              </div>
              <ArrowUpRight size={16} className="corner-icon" aria-hidden="true" />
            </div>
            <h3 className="action-card-title">Add player</h3>
            <p className="action-card-desc">
              Scout &amp; register a new squad member
            </p>
          </div>

          {/* Action Card 3: Match History */}
          <div
            className="action-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/matches')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/matches')}
            aria-label="Navigate to Match history"
          >
            <div className="action-card-header">
              <div className="action-icon-circle action-sand" aria-hidden="true">
                <LayoutList size={19} strokeWidth={2.2} />
              </div>
              {/* Window / Columns icon */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="corner-icon"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </div>
            <h3 className="action-card-title">Match history</h3>
            <p className="action-card-desc">
              View past games, lineups &amp; scores
            </p>
          </div>

          {/* Action Card 4: Backup Data */}
          <div
            className="action-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/backup')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/backup')}
            aria-label="Navigate to Backup data"
          >
            <div className="action-card-header">
              <div className="action-icon-circle action-sand" aria-hidden="true">
                {/* Database / snapshot users icon */}
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              </div>
              <Download size={15} className="corner-icon" aria-hidden="true" />
            </div>
            <h3 className="action-card-title">Backup data</h3>
            <p className="action-card-desc">
              Export squad JSON snapshot
            </p>
          </div>
        </div>
      </section>

      {/* Local Storage & Data Restore Card */}
      <section className="storage-restore-card" aria-label="Local Storage & Data Restore">
        <div className="storage-restore-left">
          <div className="restore-icon-box" aria-hidden="true">
            <FileText size={20} strokeWidth={2.2} className="restore-svg" />
          </div>

          <div className="restore-text-group">
            <div className="restore-title-row">
              <h3 className="restore-title">
                Local Storage &amp; Data Restore
              </h3>
              <span className="badge badge-green ready-badge">Ready</span>
            </div>
            <p className="restore-desc">
              Your squad data lives locally on this device. Restore a previous roster or ledger snapshot anytime by importing a saved backup JSON file.
            </p>
            <div className="restore-meta">
              <Clock size={12} strokeWidth={2.2} aria-hidden="true" />
              <span>Last restored archive: 4 days ago (Oct 18, 2024 at 19:42)</span>
            </div>
          </div>
        </div>

        <div className="storage-restore-right">
          <button
            type="button"
            className="btn-import-backup"
            onClick={() => navigate('/backup')}
            aria-label="Import backup"
          >
            <Upload size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>Import backup</span>
          </button>
        </div>
      </section>
    </div>
  );
}
