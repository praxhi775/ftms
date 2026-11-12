// A restrained football pitch with a 4-3-3 shape, drawn with thin low-contrast lines.
// Purely decorative, so it is hidden from screen readers.
const LINE = 'rgba(245, 243, 237, 0.14)';
const FAINT = 'rgba(245, 243, 237, 0.09)';
const MARKER = 'rgba(245, 243, 237, 0.38)';

// [x, y] positions, attacking upwards
const GOALKEEPER = [180, 478];
const DEFENDERS = [[62, 404], [140, 414], [220, 414], [298, 404]];
const MIDFIELDERS = [[108, 322], [180, 340], [252, 322]];
const FORWARDS = [[84, 206], [180, 186], [276, 206]];
const ALL_PLAYERS = [GOALKEEPER, ...DEFENDERS, ...MIDFIELDERS, ...FORWARDS];

const line = (points) => points.map(([x, y]) => `${x},${y}`).join(' ');

export default function LoginPitch() {
  return (
    <svg
      className="login-pitch"
      viewBox="0 0 360 534"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* pitch markings */}
      <g stroke={LINE} strokeWidth="1.5">
        <rect x="20" y="20" width="320" height="494" rx="3" />
        <line x1="20" y1="267" x2="340" y2="267" />
        <circle cx="180" cy="267" r="43" />
        {/* top end */}
        <rect x="85.2" y="20" width="189.7" height="77.6" />
        <rect x="136.9" y="20" width="86.2" height="25.9" />
        <path d="M145.6 97.6 A43 43 0 0 0 214.4 97.6" />
        {/* bottom end */}
        <rect x="85.2" y="436.4" width="189.7" height="77.6" />
        <rect x="136.9" y="488.1" width="86.2" height="25.9" />
        <path d="M145.6 436.4 A43 43 0 0 1 214.4 436.4" />
        {/* corners */}
        <path d="M20 26 A6 6 0 0 0 26 20" />
        <path d="M334 20 A6 6 0 0 0 340 26" />
        <path d="M20 508 A6 6 0 0 1 26 514" />
        <path d="M340 508 A6 6 0 0 0 334 514" />
      </g>
      <g fill={LINE}>
        <circle cx="180" cy="267" r="2" />
        <circle cx="180" cy="71.8" r="1.8" />
        <circle cx="180" cy="462.2" r="1.8" />
      </g>

      {/* the shape of the team: faint lines joining each unit */}
      <g stroke={FAINT} strokeWidth="1" strokeDasharray="2 5">
        <polyline points={line(DEFENDERS)} />
        <polyline points={line(MIDFIELDERS)} />
        <polyline points={line(FORWARDS)} />
      </g>

      {/* one pass, to hint at tactics */}
      <path d="M180 340 C 214 304, 246 262, 272 216" stroke={MARKER} strokeWidth="1.25" strokeDasharray="3 5" />
      <circle cx="274" cy="213" r="2.4" fill={MARKER} />

      {/* player positions */}
      <g stroke={MARKER} strokeWidth="1.5">
        {ALL_PLAYERS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />
        ))}
      </g>
      <circle cx="180" cy="340" r="2.6" fill={MARKER} />
    </svg>
  );
}
