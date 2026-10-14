import db from './database';

const seedPlayers = [
  { name: 'Marcus Vance', jerseyNumber: 1, age: 29, position: 'GK', preferredFoot: 'Right', height: 185, weight: 82, notes: 'Captain. Excellent shot-stopper.', status: 'active', ratings: { pac: 55, sho: 30, pas: 60, dri: 45, def: 50, phy: 80 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Julian Morales', jerseyNumber: 4, age: 26, position: 'DEF', preferredFoot: 'Right', height: 183, weight: 79, notes: 'Solid center back, aerial threat.', status: 'active', ratings: { pac: 62, sho: 40, pas: 58, dri: 50, def: 82, phy: 78 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Ethan Walker', jerseyNumber: 2, age: 24, position: 'DEF', preferredFoot: 'Right', height: 176, weight: 72, notes: 'Pacey full back with good crossing.', status: 'active', ratings: { pac: 78, sho: 45, pas: 68, dri: 65, def: 72, phy: 70 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Tomas Sterling', jerseyNumber: 3, age: 25, position: 'DEF', preferredFoot: 'Left', height: 178, weight: 74, notes: 'Left back, reliable defender.', status: 'active', ratings: { pac: 72, sho: 38, pas: 65, dri: 60, def: 75, phy: 72 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Leo Kovac', jerseyNumber: 8, age: 27, position: 'MID', preferredFoot: 'Right', height: 180, weight: 75, notes: 'Creative playmaker, vision and passing.', status: 'active', ratings: { pac: 65, sho: 70, pas: 85, dri: 82, def: 48, phy: 65 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Daniel Kim', jerseyNumber: 6, age: 28, position: 'MID', preferredFoot: 'Right', height: 181, weight: 76, notes: 'Box-to-box midfielder, engine of the team.', status: 'active', ratings: { pac: 72, sho: 65, pas: 72, dri: 68, def: 70, phy: 78 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: "Sam O'Connor", jerseyNumber: 5, age: 30, position: 'MID', preferredFoot: 'Right', height: 177, weight: 73, notes: 'Deep-lying playmaker, reads the game well.', status: 'active', ratings: { pac: 58, sho: 55, pas: 80, dri: 70, def: 72, phy: 74 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Rafael Silva', jerseyNumber: 9, age: 25, position: 'FWD', preferredFoot: 'Left', height: 182, weight: 78, notes: 'Clinical striker, top goal scorer.', status: 'active', ratings: { pac: 80, sho: 88, pas: 65, dri: 78, def: 30, phy: 76 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Tariq Al-Mansoor', jerseyNumber: 11, age: 23, position: 'FWD', preferredFoot: 'Right', height: 175, weight: 70, notes: 'Speedy winger, loves to dribble.', status: 'active', ratings: { pac: 90, sho: 72, pas: 68, dri: 85, def: 32, phy: 62 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Carlos Mendez', jerseyNumber: 13, age: 31, position: 'GK', preferredFoot: 'Right', height: 188, weight: 85, notes: 'Experienced backup keeper.', status: 'active', ratings: { pac: 48, sho: 25, pas: 55, dri: 40, def: 45, phy: 78 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Liam Brennan', jerseyNumber: 15, age: 22, position: 'DEF', preferredFoot: 'Right', height: 186, weight: 80, notes: 'Young stopper, physical presence.', status: 'active', ratings: { pac: 68, sho: 35, pas: 55, dri: 48, def: 78, phy: 82 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Noah Lindqvist', jerseyNumber: 14, age: 26, position: 'MID', preferredFoot: 'Left', height: 179, weight: 73, notes: 'Versatile midfielder, left-footed.', status: 'active', ratings: { pac: 70, sho: 62, pas: 74, dri: 72, def: 60, phy: 68 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Matteo Rossi', jerseyNumber: 7, age: 24, position: 'MID', preferredFoot: 'Right', height: 174, weight: 69, notes: 'Wide playmaker, creative with set pieces.', status: 'active', ratings: { pac: 76, sho: 68, pas: 78, dri: 80, def: 40, phy: 60 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Owen Davis', jerseyNumber: 10, age: 26, position: 'FWD', preferredFoot: 'Right', height: 178, weight: 74, notes: 'Poacher, always in the right position.', status: 'active', ratings: { pac: 74, sho: 84, pas: 62, dri: 72, def: 28, phy: 68 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Benji Costa', jerseyNumber: 17, age: 23, position: 'DEF', preferredFoot: 'Right', height: 180, weight: 76, notes: 'Utility defender, can play multiple positions.', status: 'active', ratings: { pac: 70, sho: 42, pas: 62, dri: 58, def: 74, phy: 74 }, createdAt: new Date('2024-01-15').toISOString() },
  { name: 'Kyle Henderson', jerseyNumber: 16, age: 25, position: 'MID', preferredFoot: 'Right', height: 176, weight: 71, notes: 'Ankle strain. Return Matchday 16.', status: 'injured', ratings: { pac: 74, sho: 60, pas: 70, dri: 68, def: 58, phy: 66 }, createdAt: new Date('2024-02-10').toISOString() },
  { name: 'Alex Ward', jerseyNumber: 18, age: 27, position: 'FWD', preferredFoot: 'Left', height: 180, weight: 76, notes: 'Work travel, out this weekend.', status: 'inactive', ratings: { pac: 78, sho: 75, pas: 64, dri: 74, def: 34, phy: 70 }, createdAt: new Date('2024-03-01').toISOString() },
  { name: 'Jonah Miller', jerseyNumber: 19, age: 28, position: 'DEF', preferredFoot: 'Right', height: 184, weight: 81, notes: 'Family commitment.', status: 'inactive', ratings: { pac: 64, sho: 38, pas: 60, dri: 52, def: 76, phy: 80 }, createdAt: new Date('2024-03-01').toISOString() },
];

const seedStatDefinitions = [
  { name: 'Goals', category: 'Technical', description: 'Goals scored in a match', type: 'quantitative', unit: '', inChart: true, choices: [] },
  { name: 'Assists', category: 'Tactical', description: 'Assists provided in a match', type: 'quantitative', unit: '', inChart: true, choices: [] },
  { name: 'Pass Accuracy', category: 'Technical', description: 'Passing accuracy percentage', type: 'quantitative', unit: '%', inChart: true, choices: [] },
  { name: 'Positioning', category: 'Tactical', description: 'Positional awareness and movement', type: 'qualitative', unit: '', inChart: true, choices: ['Poor', 'Average', 'Good', 'Excellent'] },
  { name: 'First Touch', category: 'Technical', description: 'Quality of first touch', type: 'qualitative', unit: '', inChart: false, choices: ['Poor', 'Average', 'Good', 'Excellent'] },
];

export async function seedDatabase() {
  const playerCount = await db.players.count();
  if (playerCount > 0) return; // Already seeded

  await db.transaction('rw', [db.players, db.matches, db.statDefinitions, db.playerStats, db.settings], async () => {
    // Seed players
    const playerIds = await db.players.bulkAdd(seedPlayers, { allKeys: true });

    // Seed stat definitions
    const statDefIds = await db.statDefinitions.bulkAdd(seedStatDefinitions, { allKeys: true });

    // Create sample completed matches
    const match1Id = await db.matches.add({
      title: 'Sunday Scrimmage #12',
      opponent: 'Internal Match',
      date: '2024-09-15',
      time: '09:30',
      venue: 'North Training Pitch',
      matchType: 'Friendly',
      status: 'completed',
      selectedPlayerIds: playerIds.slice(0, 14),
      teams: [
        { name: 'Team Green', playerIds: playerIds.slice(0, 7) },
        { name: 'Team White', playerIds: playerIds.slice(7, 14) },
      ],
      score: { home: 3, away: 2 },
      notes: 'Great attacking display. Rafael with a brace.',
      createdAt: new Date('2024-09-15').toISOString(),
    });

    const match2Id = await db.matches.add({
      title: 'Sunday Scrimmage #13',
      opponent: 'Internal Match',
      date: '2024-09-22',
      time: '10:00',
      venue: 'South Field',
      matchType: 'Friendly',
      status: 'completed',
      selectedPlayerIds: playerIds.slice(0, 14),
      teams: [
        { name: 'Team Green', playerIds: [playerIds[0], playerIds[2], playerIds[4], playerIds[6], playerIds[8], playerIds[10], playerIds[12]] },
        { name: 'Team White', playerIds: [playerIds[1], playerIds[3], playerIds[5], playerIds[7], playerIds[9], playerIds[11], playerIds[13]] },
      ],
      score: { home: 1, away: 1 },
      notes: 'Tight game, strong defensive performances.',
      createdAt: new Date('2024-09-22').toISOString(),
    });

    // Create an upcoming match
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    await db.matches.add({
      title: 'Sunday Scrimmage #14',
      opponent: 'Internal Match',
      date: futureDate.toISOString().split('T')[0],
      time: '09:30',
      venue: 'North Training Pitch',
      matchType: 'Friendly',
      status: 'upcoming',
      selectedPlayerIds: playerIds.slice(0, 15),
      teams: [],
      score: null,
      notes: '',
      createdAt: new Date().toISOString(),
    });

    // Seed some stats for completed matches
    const goalsDefId = statDefIds[0];
    const assistsDefId = statDefIds[1];
    const passAccDefId = statDefIds[2];
    const positioningDefId = statDefIds[3];

    // Match 1 stats
    const match1Stats = [
      { matchId: match1Id, playerId: playerIds[7], statDefId: goalsDefId, value: '2' },
      { matchId: match1Id, playerId: playerIds[13], statDefId: goalsDefId, value: '1' },
      { matchId: match1Id, playerId: playerIds[4], statDefId: assistsDefId, value: '2' },
      { matchId: match1Id, playerId: playerIds[8], statDefId: assistsDefId, value: '1' },
      { matchId: match1Id, playerId: playerIds[4], statDefId: passAccDefId, value: '88' },
      { matchId: match1Id, playerId: playerIds[6], statDefId: passAccDefId, value: '82' },
      { matchId: match1Id, playerId: playerIds[7], statDefId: positioningDefId, value: 'Excellent' },
      { matchId: match1Id, playerId: playerIds[4], statDefId: positioningDefId, value: 'Good' },
    ];

    // Match 2 stats
    const match2Stats = [
      { matchId: match2Id, playerId: playerIds[13], statDefId: goalsDefId, value: '1' },
      { matchId: match2Id, playerId: playerIds[7], statDefId: goalsDefId, value: '1' },
      { matchId: match2Id, playerId: playerIds[5], statDefId: assistsDefId, value: '1' },
      { matchId: match2Id, playerId: playerIds[12], statDefId: assistsDefId, value: '1' },
      { matchId: match2Id, playerId: playerIds[4], statDefId: passAccDefId, value: '91' },
      { matchId: match2Id, playerId: playerIds[5], statDefId: passAccDefId, value: '85' },
    ];

    await db.playerStats.bulkAdd([...match1Stats, ...match2Stats]);

    // Set last backup setting
    await db.settings.put({ key: 'lastBackup', value: null });
  });
}
