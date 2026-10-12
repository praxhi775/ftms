import PlayerRow from './PlayerRow';

export default function TeamCard({ team, onSwapPlayer }) {
  const { letter, name, subtitle, badgeTheme, positionSummary, players } = team;

  return (
    <article className="generated-side-card" aria-label={name}>
      {/* Team Card Header */}
      <div className="side-card-header">
        <div className={`side-letter-badge badge-theme-${badgeTheme}`} aria-hidden="true">
          {letter}
        </div>
        <div className="side-header-info">
          <h3 className="side-team-name">{name}</h3>
          <span className="side-team-subtitle">{subtitle}</span>
        </div>
      </div>

      {/* Position Summary Chips */}
      <div className="position-summary-chips" role="list" aria-label="Position Summary">
        {positionSummary.map(({ label, count }) => (
          <span key={label} className="summary-chip" role="listitem">
            {label}: {count}
          </span>
        ))}
      </div>

      {/* Players List */}
      <div className="side-players-list" role="list">
        {players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            onSwap={onSwapPlayer}
          />
        ))}
      </div>
    </article>
  );
}
