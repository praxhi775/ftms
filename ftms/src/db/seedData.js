import db from './database';

const seedStatDefinitions = [
  { name: 'Goals', category: 'Technical', description: 'Goals scored in a session', type: 'quantitative', unit: '', inChart: true, choices: [] },
  { name: 'Assists', category: 'Tactical', description: 'Assists provided in a session', type: 'quantitative', unit: '', inChart: true, choices: [] },
  { name: 'Pass Accuracy', category: 'Technical', description: 'Passing accuracy percentage', type: 'quantitative', unit: '%', inChart: true, choices: [] },
  { name: 'Positioning', category: 'Tactical', description: 'Positional awareness and movement', type: 'qualitative', unit: '', inChart: true, choices: ['Poor', 'Average', 'Good', 'Excellent'] },
  { name: 'First Touch', category: 'Technical', description: 'Quality of first touch', type: 'qualitative', unit: '', inChart: false, choices: ['Poor', 'Average', 'Good', 'Excellent'] },
];

// For a brand-new manager: only the built-in stat definitions, no players or sessions.
export async function initializeEmptyManagerData() {
  const [playerCount, defCount] = await Promise.all([db.players.count(), db.statDefinitions.count()]);
  if (playerCount > 0 || defCount > 0) return;
  await db.statDefinitions.bulkAdd(seedStatDefinitions);
  await db.settings.put({ key: 'lastBackup', value: null });
}

// Sample manager: starts with the data from sampleData.json (your exported backup).
// Only runs on an empty database, so anything the sample manager changes or deletes stays that way.
export async function seedSampleManagerData() {
  const [playerCount, matchCount] = await Promise.all([db.players.count(), db.matches.count()]);
  if (playerCount > 0 || matchCount > 0) return;

  const { default: sample } = await import('./sampleData.json');
  const {
    players = [],
    matches = [],
    statDefinitions = [],
    playerStats = [],
    settings = [],
  } = sample.data;

  await db.transaction(
    'rw',
    [db.players, db.matches, db.statDefinitions, db.playerStats, db.settings],
    async () => {
      if (players.length) await db.players.bulkAdd(players);
      if (matches.length) await db.matches.bulkAdd(matches);
      if (statDefinitions.length) await db.statDefinitions.bulkAdd(statDefinitions);
      if (playerStats.length) await db.playerStats.bulkAdd(playerStats);
      if (settings.length) await db.settings.bulkAdd(settings);
    }
  );
}

// Called once after a manager's database is open.
// The sample manager starts with the sample data; everyone else starts empty.
export async function prepareManagerData({ sample = false } = {}) {
  if (sample) {
    await seedSampleManagerData();
  } else {
    await initializeEmptyManagerData();
  }
}
