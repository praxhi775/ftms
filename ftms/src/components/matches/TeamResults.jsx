import { Shuffle, XCircle, Users, ShieldAlert } from 'lucide-react';

const TEAM_THEMES = [
  { name: 'Team A', headerBg: '#003B1B', headerText: '#FFFFFF', badgeBg: '#D4F4E2', badgeText: '#064E3B' },
  { name: 'Team B', headerBg: '#006D30', headerText: '#FFFFFF', badgeBg: '#C6F4D6', badgeText: '#064E3B' },
  { name: 'Team C', headerBg: '#9A3412', headerText: '#FFFFFF', badgeBg: '#FED7AA', badgeText: '#7C2D12' },
  { name: 'Team D', headerBg: '#0369A1', headerText: '#FFFFFF', badgeBg: '#BAE6FD', badgeText: '#075985' },
];

export default function TeamResults({
  generatedTeams,
  substitutes,
  playersPerTeam,
  onRegenerate,
  onClear,
}) {
  if (!generatedTeams || generatedTeams.length === 0) {
    return null;
  }

  return (
    <section className="team-results-section" aria-labelledby="generated-teams-heading">
      <div className="team-results-header">
        <div>
          <span className="results-eyebrow">STEP 2 OF 2 • BALANCED SIDES</span>
          <h2 id="generated-teams-heading" className="team-results-title">
            Generated Matchday Lineups
          </h2>
          <p className="team-results-subtitle">
            {generatedTeams.length} teams of {playersPerTeam} players formed via fair randomized squad draw.
          </p>
        </div>

        <div className="team-results-actions">
          <button
            type="button"
            className="btn-results-action btn-shuffle"
            onClick={onRegenerate}
            aria-label="Re-shuffle teams"
          >
            <Shuffle size={14} strokeWidth={2.5} />
            <span>Re-shuffle Sides</span>
          </button>
          <button
            type="button"
            className="btn-results-action btn-dismiss"
            onClick={onClear}
            aria-label="Dismiss generated teams"
          >
            <XCircle size={14} strokeWidth={2.5} />
            <span>Clear Lineups</span>
          </button>
        </div>
      </div>

      {/* Grid of Teams */}
      <div className={`teams-grid-layout grid-${generatedTeams.length}`}>
        {generatedTeams.map((team, idx) => {
          const theme = TEAM_THEMES[idx % TEAM_THEMES.length];
          return (
            <article key={team.name} className="generated-team-card">
              <div
                className="team-card-banner"
                style={{ backgroundColor: theme.headerBg, color: theme.headerText }}
              >
                <div className="team-card-title-group">
                  <Users size={16} strokeWidth={2.2} />
                  <h3 className="team-banner-name">{team.name}</h3>
                </div>
                <span
                  className="team-banner-badge"
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                >
                  {team.players.length} Players
                </span>
              </div>

              <div className="team-roster-list">
                {team.players.map((player) => (
                  <div key={player.id} className="team-player-item">
                    <div className="team-player-avatar" aria-hidden="true">
                      {player.initials}
                    </div>
                    <div className="team-player-info">
                      <span className="team-player-name">{player.name}</span>
                      <span className="team-player-role">{player.role}</span>
                    </div>
                    <span className={`position-badge pos-${player.position.toLowerCase()}`}>
                      {player.position}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* Substitutes / Bench List */}
      {substitutes && substitutes.length > 0 && (
        <div className="substitutes-card">
          <div className="substitutes-header">
            <div className="substitutes-title-row">
              <ShieldAlert size={16} className="bench-icon" />
              <h3 className="substitutes-title">Substitutes &amp; Rotation Bench</h3>
            </div>
            <span className="substitutes-badge">
              {substitutes.length} Rotation Player{substitutes.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="substitutes-desc">
            Surplus squad members queued for rotation subs during intervals or tactical refresh.
          </p>

          <div className="substitutes-chips-row">
            {substitutes.map((player) => (
              <div key={player.id} className="substitute-chip">
                <span className="sub-avatar">{player.initials}</span>
                <span className="sub-name">{player.name}</span>
                <span className={`sub-pos pos-${player.position.toLowerCase()}`}>
                  {player.position}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
