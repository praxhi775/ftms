import Dexie from 'dexie';

// Each manager gets their own local database, named after their account id, so two managers
// using the same browser never see each other's players, sessions or stats.
const SCHEMA = {
  players: '++id, name, jerseyNumber, position, status',
  matches: '++id, date, status',
  statDefinitions: '++id, name, type, inChart',
  playerStats: '++id, matchId, playerId, statDefId, [matchId+playerId]',
  settings: 'key',
};

export const databaseNameForUser = (uid) => `FootballTeamManager_${uid}`;

function createDatabase(name) {
  const instance = new Dexie(name);
  instance.version(1).stores(SCHEMA);
  return instance;
}

let current = null;

export function getOpenDatabaseName() {
  return current ? current.name : null;
}

export async function openUserDatabase(uid) {
  const name = databaseNameForUser(uid);
  if (current && current.name === name && current.isOpen()) return current;
  if (current) current.close();
  const next = createDatabase(name);
  await next.open();
  current = next;
  return next;
}

export function closeUserDatabase() {
  if (current) {
    current.close();
    current = null;
  }
}

// Services keep importing `db`; it always points at the database of the logged-in manager.
const db = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'then') return undefined; // so `await db` never treats it as a promise
      if (!current) {
        throw new Error('No manager database is open. Please log in first.');
      }
      const value = current[prop];
      return typeof value === 'function' ? value.bind(current) : value;
    },
  }
);

export default db;
