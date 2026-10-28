// Helpers for match sessions (league-style fixtures between two teams of a match)

export const SESSION_STATUSES = {
  upcoming: { label: 'Upcoming', color: '#9A3412', bg: '#FFEDD5', border: '#FDBA74' },
  active: { label: 'Active', color: '#047857', bg: '#D1FAE5', border: '#6EE7B7' },
  completed: { label: 'Completed', color: '#374151', bg: '#E5E7EB', border: '#D1D5DB' },
};

export const SESSION_STATUS_ORDER = ['upcoming', 'active', 'completed'];

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const newTeamId = () => newId('team');

export function teamIdOfPlayer(teams = [], playerId) {
  const team = teams.find((t) => (t.playerIds || []).includes(playerId));
  return team ? team.id : null;
}

// Goals scored in a session by each of its two teams, from the activity log
export function sessionGoals(session, events = [], teams = []) {
  let a = 0;
  let b = 0;
  events.forEach((ev) => {
    if (ev.type !== 'goal' || ev.sessionId !== session.id) return;
    const teamId = ev.teamId || teamIdOfPlayer(teams, ev.playerId);
    if (teamId === session.teamAId) a += 1;
    else if (teamId === session.teamBId) b += 1;
  });
  return { a, b };
}

// League table from completed sessions (3 points for a win, 1 for a draw)
export function computeStandings(sessions = [], teams = []) {
  const table = {};
  const ensure = (teamId) => {
    if (!table[teamId]) {
      table[teamId] = { teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    }
    return table[teamId];
  };

  // every team that takes part in a session is listed, even before it has played
  sessions.forEach((s) => {
    ensure(s.teamAId);
    ensure(s.teamBId);
  });

  sessions
    .filter((s) => s.status === 'completed' && s.score)
    .forEach((s) => {
      const home = ensure(s.teamAId);
      const away = ensure(s.teamBId);
      const hg = Number(s.score.home) || 0;
      const ag = Number(s.score.away) || 0;

      home.played += 1;
      away.played += 1;
      home.gf += hg;
      home.ga += ag;
      away.gf += ag;
      away.ga += hg;

      if (hg > ag) {
        home.won += 1;
        home.pts += 3;
        away.lost += 1;
      } else if (hg < ag) {
        away.won += 1;
        away.pts += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.pts += 1;
        away.pts += 1;
      }
    });

  const nameOf = (id) => teams.find((t) => t.id === id)?.name || '';

  return Object.values(table)
    .map((row) => ({ ...row, gd: row.gf - row.ga }))
    .sort(
      (x, y) =>
        y.pts - x.pts ||
        y.gd - x.gd ||
        y.gf - x.gf ||
        nameOf(x.teamId).localeCompare(nameOf(y.teamId))
    );
}