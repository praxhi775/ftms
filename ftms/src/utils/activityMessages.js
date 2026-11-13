// Builds the readable text of activity entries (what changed, from what to what).
// Pure functions: no database and no Firebase in here.
export const MAX_MESSAGE = 200;

const show = (value) => (value === null || value === undefined || value === '' ? '—' : String(value));

// "Prefix: a, b, c +2 more" that always fits in `max` characters
export function fitList(prefix, items, max = MAX_MESSAGE) {
  if (!items.length) return prefix.slice(0, max);
  let out = prefix;
  let shown = 0;
  for (let i = 0; i < items.length; i += 1) {
    const piece = (shown === 0 ? ' ' : ', ') + items[i];
    const left = items.length - i - 1;
    const reserve = left > 0 ? ` +${left} more`.length : 0;
    if (out.length + piece.length + reserve > max) break;
    out += piece;
    shown += 1;
  }
  if (shown === 0) return `${prefix} ${items[0]}`.slice(0, max); // even one item is too long: cut it
  if (shown < items.length) out += ` +${items.length - shown} more`;
  return out;
}

// ---------- player profile ----------
const PROFILE_FIELDS = [
  ['name', 'Name'],
  ['jerseyNumber', 'Jersey'],
  ['position', 'Position'],
  ['age', 'Age'],
  ['height', 'Height'],
  ['weight', 'Weight'],
  ['status', 'Status'],
  ['preferredFoot', 'Foot'],
  ['weakFoot', 'Weak foot'],
  ['skillMoves', 'Skill moves'],
  ['reputation', 'Reputation'],
];

export function profileChanges(before = {}, after = {}) {
  const changes = [];
  PROFILE_FIELDS.forEach(([key, label]) => {
    const a = before[key] ?? null;
    const b = after[key] ?? null;
    if (String(a ?? '') !== String(b ?? '')) {
      if (a === null || a === '') changes.push(`${label} set to ${show(b)}`);
      else if (b === null || b === '') changes.push(`${label} cleared`);
      else changes.push(`${label} ${show(a)} → ${show(b)}`);
    }
  });
  if (String(before.notes ?? '') !== String(after.notes ?? '')) changes.push('Notes edited');
  return changes;
}

export const profileMessage = (name, changes) => fitList(`Updated profile of ${name}:`, changes);

// ---------- player stats (sub-metric ratings) ----------
const metricMap = (categories = []) => {
  const map = new Map();
  categories.forEach((cat) =>
    (cat.metrics || []).forEach((m) =>
      map.set(m.name, { value: Number.parseInt(m.value, 10), inChart: !!m.inChart })
    )
  );
  return map;
};

export function subMetricChanges(beforeCategories, afterCategories) {
  const before = metricMap(beforeCategories);
  const after = metricMap(afterCategories);
  const changes = [];
  after.forEach((now, name) => {
    const was = before.get(name);
    if (!was) changes.push(`${name} added at ${show(now.value)}`);
    else if (was.value !== now.value) changes.push(`${name} ${show(was.value)} → ${show(now.value)}`);
    else if (was.inChart !== now.inChart) changes.push(`${name} ${now.inChart ? 'added to' : 'removed from'} chart`);
  });
  before.forEach((_was, name) => {
    if (!after.has(name)) changes.push(`${name} removed`);
  });
  return changes;
}

export function playerStatsMessage(name, ovrBefore, ovrAfter, changes) {
  const ovr = ovrBefore === ovrAfter ? `OVR ${ovrAfter}` : `OVR ${ovrBefore} → ${ovrAfter}`;
  return fitList(`Changed stats of ${name} (${ovr}):`, changes);
}

// ---------- team lineups ----------
// Compares two lists of teams. `nameOf(playerId)` gives a player's name.
export function lineupChanges(beforeTeams = [], afterTeams = [], nameOf = (id) => `Player ${id}`) {
  const keyOf = (team, index) => team.id || `#${index}`;
  const before = new Map(beforeTeams.map((t, i) => [keyOf(t, i), t]));
  const after = new Map(afterTeams.map((t, i) => [keyOf(t, i), t]));
  const label = (team, i) => team.name || `Team ${String.fromCharCode(65 + i)}`;

  const lines = [];
  after.forEach((team, key) => {
    if (!before.has(key)) lines.push(`Added team ${label(team, [...after.keys()].indexOf(key))}`);
  });
  before.forEach((team, key) => {
    if (!after.has(key)) lines.push(`Removed team ${label(team, [...before.keys()].indexOf(key))}`);
  });
  after.forEach((team, key) => {
    const was = before.get(key);
    if (was && (was.name || '') !== (team.name || '')) {
      lines.push(`Renamed team ${show(was.name)} → ${show(team.name)}`);
    }
  });

  // which team each player is in, before and after
  const teamNameOfPlayer = (teams) => {
    const map = new Map();
    teams.forEach((t, i) => (t.playerIds || []).forEach((pid) => map.set(pid, label(t, i))));
    return map;
  };
  const was = teamNameOfPlayer(beforeTeams);
  const now = teamNameOfPlayer(afterTeams);
  const ids = new Set([...was.keys(), ...now.keys()]);
  const moves = [];
  ids.forEach((pid) => {
    const from = was.get(pid) || 'no team';
    const to = now.get(pid) || 'no team';
    if (from !== to) moves.push(`${nameOf(pid)}: ${from} → ${to}`);
  });
  return [...lines, ...moves];
}

export const lineupMessage = (title, changes) => fitList(`Updated lineups in "${title}":`, changes);
