export default function PlayerTraitsPanel() {
  return (
    <div className="player-traits-stack">
      {/* Card 1: Preferred Foot */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Preferred Foot</span>
          <div className="foot-selector-group">
            <span className="foot-pill foot-secondary">L</span>
            <span className="foot-pill foot-primary">
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
              <span>R (Primary)</span>
            </span>
          </div>
        </div>
      </article>

      {/* Card 2: Weak Foot Ability */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Weak Foot Ability</span>
          <span className="trait-badge badge-high">High</span>
        </div>
        <p className="trait-detail-text">Left foot execution</p>
      </article>

      {/* Card 3: Skill Moves */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Skill Moves</span>
          <span className="trait-badge badge-high">High</span>
        </div>
        <p className="trait-detail-text">1v1 Dribbling repertoire</p>
      </article>

      {/* Card 4: Reputation Index */}
      <article className="trait-card">
        <div className="trait-top-row">
          <span className="trait-label">Reputation Index</span>
          <span className="trait-badge badge-med">Med</span>
        </div>
        <p className="trait-detail-text">League standing Tier 2</p>
      </article>
    </div>
  );
}
