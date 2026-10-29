import { useState, useEffect } from 'react';
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
  Bell,
  Users,
  Trophy
} from 'lucide-react';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';
import { backupService } from '../services/backupService';
import PlayerFormModal from '../components/players/PlayerFormModal';
import MatchFormModal from '../components/matches/MatchFormModal';

export default function Dashboard() {
  const navigate = useNavigate();

  const [totalPlayers, setTotalPlayers] = useState(0);
  const [nextMatch, setNextMatch] = useState(null);
  const [recentCompleted, setRecentCompleted] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  // Quick Action Modals
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [pCount, nMatch, compMatches, sInfo] = await Promise.all([
        playerService.count(),
        matchService.getNextUpcoming(),
        matchService.getCompleted(),
        backupService.getStorageInfo(),
      ]);

      setTotalPlayers(pCount);
      setNextMatch(nMatch);
      setRecentCompleted(compMatches[0] || null);
      setStorageInfo(sInfo);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
              Tactical board is synced, rosters are prepped ({totalPlayers} registered), and pitch is cleared.
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
            <div className="card-content-headline">
              <div className="icon-circle icon-circle-mint" aria-hidden="true">
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
                {nextMatch ? `${nextMatch.date} ${nextMatch.time || '09:30'}` : 'No Upcoming Session'}
              </h2>
            </div>

            {nextMatch && <p className="session-match-name">{nextMatch.title}</p>}

            <p className="card-description session-description">
              {nextMatch
                ? `${nextMatch.selectedPlayerIds?.length || 0} players selected.`
                : 'Schedule your next training scrimmage or session to generate balanced teams.'}
            </p>

            <div className="card-footer session-footer">
              <MapPin size={14} className="location-icon" aria-hidden="true" />
              <span>{nextMatch?.venue || 'North Training Pitch'}</span>
            </div>
          </article>

          {/* Card 2: Directive */}
          <article className="directive-card">
            <div className="card-top-bar directive-top-bar">
              <span className="badge badge-peach">
                {recentCompleted ? 'Logged Fixture' : 'Pending Directives'}
              </span>
            </div>

            <div className="card-content-headline">
              <div className="icon-circle icon-circle-dark" aria-hidden="true">
                <Bell size={20} className="bell-icon" strokeWidth={2.4} />
              </div>
              <h2 className="directive-title">
                {recentCompleted ? 'Update Session Log & Stats' : 'Update Status After Session'}
              </h2>
            </div>

            <p className="card-description directive-description">
              {recentCompleted
                ? `Last session: ${recentCompleted.title} (${recentCompleted.score ? `${recentCompleted.score.home}-${recentCompleted.score.away}` : 'Completed'}). Record individual ratings & stats.`
                : "Don't forget to record attendance, session outcome, and player statuses after the final whistle."}
            </p>

            <div className="card-footer directive-footer">
              <button
                type="button"
                className="btn-directive"
                onClick={() => navigate(recentCompleted ? `/sessions/${recentCompleted.id}` : '/sessions')}
                aria-label="Update Status Now on Sessions page"
              >
                <span>{recentCompleted ? 'Record Session Stats' : 'Update Status Now'}</span>
                <ExternalLink size={13} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="link-direct-entry"
                onClick={() => navigate('/sessions')}
              >
                All fixtures
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Immediate Directives Section (4 Quick-Action Cards) */}
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
            onClick={() => setIsNewMatchOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setIsNewMatchOpen(true)}
            aria-label="Open New session dialog"
          >
            <div className="action-card-header">
              <div className="action-icon-circle action-mint" aria-hidden="true">
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
            <h3 className="action-card-title">New session</h3>
            <p className="action-card-desc">
              Pick squad &amp; generate balanced teams
            </p>
          </div>

          {/* Action Card 2: Add Player */}
          <div
            className="action-card"
            role="button"
            tabIndex={0}
            onClick={() => setIsAddPlayerOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setIsAddPlayerOpen(true)}
            aria-label="Open Add player dialog"
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
            onClick={() => navigate('/sessions')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/sessions')}
            aria-label="Navigate to Session history"
          >
            <div className="action-card-header">
              <div className="action-icon-circle action-sand" aria-hidden="true">
                <LayoutList size={19} strokeWidth={2.2} />
              </div>
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
            <h3 className="action-card-title">Session history</h3>
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
              <span className="badge badge-green ready-badge">IndexedDB Ready</span>
            </div>
            <p className="restore-desc">
              Your squad data lives locally on this device ({totalPlayers} players recorded). Restore a previous roster snapshot anytime by importing a saved backup JSON file.
            </p>
            <div className="restore-meta">
              <Clock size={12} strokeWidth={2.2} aria-hidden="true" />
              <span>
                {storageInfo?.lastRestored
                  ? `Last restored: ${new Date(storageInfo.lastRestored).toLocaleDateString()}`
                  : storageInfo?.lastBackup
                  ? `Last export: ${new Date(storageInfo.lastBackup).toLocaleDateString()}`
                  : 'Storage active in this browser'}
              </span>
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

      {/* Add Player Modal from Dashboard Quick Action */}
      <PlayerFormModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        onPlayerSaved={() => {
          loadDashboardData();
        }}
      />

      {/* New Match Modal from Dashboard Quick Action */}
      <MatchFormModal
        isOpen={isNewMatchOpen}
        onClose={() => setIsNewMatchOpen(false)}
        onMatchSaved={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
}