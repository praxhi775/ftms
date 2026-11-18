// Continuous animated football rolling sideways across the hero panel
export default function FootballAnimation() {
  return (
    <div className="football-scene" aria-hidden="true">
      {/* Subtle pitch / turf line */}
      <div className="football-pitch-line" />

      {/* The rolling unit: travels horizontally across the section */}
      <div className="football-carrier">
        {/* Ground shadow: travels horizontally with the ball without spinning */}
        <div className="football-shadow" />

        {/* The football SVG: spins clockwise as it rolls */}
        <svg
          className="football-ball"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="ftmsBallShading" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#F5F3ED" />
              <stop offset="100%" stopColor="#C9C3B4" />
            </radialGradient>
            <radialGradient id="ftmsPatchShading" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#1B382B" />
              <stop offset="100%" stopColor="#081A12" />
            </radialGradient>
            <clipPath id="ftmsBallClip">
              <circle cx="50" cy="50" r="47" />
            </clipPath>
          </defs>

          {/* Base Sphere */}
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="url(#ftmsBallShading)"
            stroke="#08261b"
            strokeWidth="2.2"
          />

          <g clipPath="url(#ftmsBallClip)">
            {/* Center Pentagon */}
            <polygon
              points="50,32 67.1,44.4 60.6,64.6 39.4,64.6 32.9,44.4"
              fill="url(#ftmsPatchShading)"
              stroke="#08261b"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Outer Pentagons */}
            {/* Top */}
            <polygon
              points="50,19 61,11 65,-5 35,-5 39,11"
              fill="url(#ftmsPatchShading)"
              stroke="#08261b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Top Right */}
            <polygon
              points="79.5,40.4 87,26 104,30 104,56 89,55"
              fill="url(#ftmsPatchShading)"
              stroke="#08261b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Bottom Right */}
            <polygon
              points="68.2,75.1 84,70 91,89 74,105 58,88"
              fill="url(#ftmsPatchShading)"
              stroke="#08261b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Bottom Left */}
            <polygon
              points="31.8,75.1 42,88 26,105 9,89 16,70"
              fill="url(#ftmsPatchShading)"
              stroke="#08261b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Top Left */}
            <polygon
              points="20.5,40.4 11,55 -4,56 -4,30 13,26"
              fill="url(#ftmsPatchShading)"
              stroke="#08261b"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Seams connecting center to outer pentagons */}
            <g
              stroke="#08261b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="50" y1="32" x2="50" y2="19" />
              <line x1="67.1" y1="44.4" x2="79.5" y2="40.4" />
              <line x1="60.6" y1="64.6" x2="68.2" y2="75.1" />
              <line x1="39.4" y1="64.6" x2="31.8" y2="75.1" />
              <line x1="32.9" y1="44.4" x2="20.5" y2="40.4" />

              {/* Connecting seams forming hexagons */}
              <line x1="61" y1="11" x2="87" y2="26" />
              <line x1="89" y1="55" x2="84" y2="70" />
              <line x1="58" y1="88" x2="42" y2="88" />
              <line x1="16" y1="70" x2="11" y2="55" />
              <line x1="13" y1="26" x2="39" y2="11" />

              {/* Edge relief lines */}
              <line x1="74" y1="18" x2="81" y2="7" />
              <line x1="96" y1="62" x2="97" y2="60" />
              <line x1="50" y1="88" x2="50" y2="97" />
              <line x1="26" y1="18" x2="19" y2="7" />
            </g>
          </g>

          {/* Spherical Specular Gloss Highlight */}
          <ellipse
            cx="36"
            cy="28"
            rx="18"
            ry="11"
            fill="rgba(255, 255, 255, 0.22)"
            transform="rotate(-28 36 28)"
            pointerEvents="none"
          />
        </svg>
      </div>
    </div>
  );
}
