export default function MatchdayBanner() {
  return (
    <article className="matchday-banner-card" aria-label="Sunday Matchday Sheet">
      {/* Background SVG subtle pitch markings */}
      <svg
        className="banner-pitch-background"
        viewBox="0 0 800 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Halfway line */}
        <line x1="440" y1="0" x2="440" y2="120" stroke="#EAE4D8" strokeWidth="1.2" />
        {/* Center circle */}
        <circle cx="440" cy="60" r="38" stroke="#EAE4D8" strokeWidth="1.2" fill="none" />
        <circle cx="440" cy="60" r="2.5" fill="#EAE4D8" />
        {/* Penalty area right side */}
        <rect x="680" y="15" width="120" height="90" stroke="#EAE4D8" strokeWidth="1.2" fill="none" />
        {/* Goal area right side */}
        <rect x="740" y="35" width="60" height="50" stroke="#EAE4D8" strokeWidth="1.2" fill="none" />
        {/* Penalty arc */}
        <path d="M 680,45 A 25,25 0 0,0 680,75" stroke="#EAE4D8" strokeWidth="1.2" fill="none" />
      </svg>

      {/* Banner Content */}
      <div className="banner-content-inner">
        <div className="banner-icon-circle" aria-hidden="true">
          {/* Soccer ball icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="banner-ball-svg"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m4.93 4.93 4.24 4.24" />
            <path d="m14.83 9.17 4.24-4.24" />
            <path d="m14.83 14.83 4.24 4.24" />
            <path d="m9.17 14.83-4.24 4.24" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>

        <h2 className="banner-sheet-title">
          Sunday Matchday Sheet
        </h2>
      </div>
    </article>
  );
}
