import Dexie from 'dexie';

const db = new Dexie('FootballTeamManager');

db.version(1).stores({
  players: '++id, name, jerseyNumber, position, status',
  matches: '++id, date, status',
  statDefinitions: '++id, name, type, inChart',
  playerStats: '++id, matchId, playerId, statDefId, [matchId+playerId]',
  settings: 'key',
});

export default db;
