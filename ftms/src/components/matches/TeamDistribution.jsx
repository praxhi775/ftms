const TEAM_SEGMENT_STYLES = [
  { name: 'Team A', bg: '#003B1B', color: '#FFFFFF' },
  { name: 'Team B', bg: '#86EFAC', color: '#064E3B' },
  { name: 'Team C', bg: '#FED7AA', color: '#9A3412' },
  { name: 'Team D', bg: '#BAE6FD', color: '#0369A1' },
];

export default function TeamDistribution({ numberOfTeams, playersPerTeam }) {
  const matchTypeLabel = `${playersPerTeam}v${playersPerTeam} Match`;

  return (
    <div className="team-distribution-wrapper">
      <div className="distribution-header-row">
        <span className="distribution-label">TEAM DISTRIBUTION</span>
        <span className="distribution-match-type">{matchTypeLabel}</span>
      </div>

      <div className="distribution-bar" role="img" aria-label={`Team distribution: ${numberOfTeams} teams of ${playersPerTeam} players`}>
        {Array.from({ length: numberOfTeams }).map((_, index) => {
          const style = TEAM_SEGMENT_STYLES[index % TEAM_SEGMENT_STYLES.length];
          return (
            <div
              key={style.name}
              className="distribution-segment"
              style={{
                backgroundColor: style.bg,
                color: style.color,
              }}
            >
              <span className="segment-text">
                {style.name}: {playersPerTeam}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
