const LEVELS = ['High', 'Med', 'Low'];

const REPUTATION_TIER = { High: 'Tier 1', Med: 'Tier 2', Low: 'Tier 3' };

function normalizeLevel(value) {
  return LEVELS.includes(value) ? value : 'Med';
}

function LevelBadge({ level }) {
  return (
    <span className={`trait-badge badge-${level.toLowerCase()}`}>{level}</span>
  );
}

function BootIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="boot-svg"
      aria-hidden="true"
    >
      <path d="M4 16v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
      <path d="M4 16h16" />
      <path d="M4 20h16" />
    </svg>
  );
}

export default function PlayerTraitsPanel({ player }) {
  const foot = player?.preferredFoot || 'Right';
  const leftActive = foot === 'Left' || foot === 'Both';
  const rightActive = foot === 'Right' || foot === 'Both';
  const isBoth = foot === 'Both';

  const weakFoot = normalizeLevel(player?.weakFoot);
  const skillMoves = normalizeLevel(player?.skillMoves);
  const reputation = normalizeLevel(player?.reputation);

  const weakFootDetail =
    foot === 'Left' ? 'Right foot execution' : foot === 'Both' ? 'Off-foot execution' : 'Left foot execution';

  const renderFootPill = (side, active) => {
    const label = isBoth ? side : `${side} (Primary)`;
    if (active) {
      return (
        <span className="foot-pill foot-primary">
          <BootIcon />
          <span>{label}</span>
        </span>
      );
    }
    return <span className="foot-pill foot-secondary">{side}</span>;
  };

  return (
    <div className="player-traits-stack">
      {/* Card 1: Preferred Foot */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Preferred Foot</span>
          <div className="foot-selector-group">
            {renderFootPill('L', leftActive)}
            {renderFootPill('R', rightActive)}
          </div>
        </div>
        {isBoth && <p className="trait-detail-text">Comfortable with both feet</p>}
      </article>

      {/* Card 2: Weak Foot Ability */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Weak Foot Ability</span>
          <LevelBadge level={weakFoot} />
        </div>
        <p className="trait-detail-text">{weakFootDetail}</p>
      </article>

      {/* Card 3: Skill Moves */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Skill Moves</span>
          <LevelBadge level={skillMoves} />
        </div>
        <p className="trait-detail-text">1v1 Dribbling repertoire</p>
      </article>

      {/* Card 4: Reputation Index */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Reputation Index</span>
          <LevelBadge level={reputation} />
        </div>
        <p className="trait-detail-text">League standing {REPUTATION_TIER[reputation]}</p>
      </article>
    </div>
  );
}