export default function MatchHeader() {
  return (
    <header className="match-header-container">
      <div className="match-header-meta">
        <span className="matchday-badge">MATCHDAY 14</span>
        <span className="matchday-session">
          Sunday Morning Session • 10:30 AM
        </span>
      </div>

      <div className="match-title-row">
        <h1 className="match-main-heading">
          New Match <span className="match-italic-subtitle">Who's playing today?</span>
        </h1>
      </div>

      <p className="match-header-description">
        Select available squad members and configure team parameters to generate balanced, competitive sides.
      </p>
    </header>
  );
}
