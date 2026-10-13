/**
 * Randomly distribute players into N teams as evenly as possible.
 * Returns array of team objects: [{ name: 'Team 1', playerIds: [...] }, ...]
 */
export function generateTeams(playerIds, numberOfTeams = 2) {
  if (!playerIds.length || numberOfTeams < 1) return [];

  // Shuffle using Fisher-Yates
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const teamNames = ['Team Green', 'Team White', 'Team Blue', 'Team Red', 'Team Gold', 'Team Purple'];
  const teams = Array.from({ length: numberOfTeams }, (_, i) => ({
    name: teamNames[i] || `Team ${i + 1}`,
    playerIds: [],
  }));

  // Distribute players round-robin
  shuffled.forEach((playerId, index) => {
    teams[index % numberOfTeams].playerIds.push(playerId);
  });

  return teams;
}

/**
 * Swap two players between teams.
 * Returns new teams array with the swap applied.
 */
export function swapPlayers(teams, playerIdA, teamIndexA, playerIdB, teamIndexB) {
  const newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));

  const idxA = newTeams[teamIndexA].playerIds.indexOf(playerIdA);
  const idxB = newTeams[teamIndexB].playerIds.indexOf(playerIdB);

  if (idxA === -1 || idxB === -1) return teams;

  newTeams[teamIndexA].playerIds[idxA] = playerIdB;
  newTeams[teamIndexB].playerIds[idxB] = playerIdA;

  return newTeams;
}

/**
 * Move a player from one team to another.
 * Returns new teams array.
 */
export function movePlayer(teams, playerId, fromTeamIndex, toTeamIndex) {
  const newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));

  const idx = newTeams[fromTeamIndex].playerIds.indexOf(playerId);
  if (idx === -1) return teams;

  newTeams[fromTeamIndex].playerIds.splice(idx, 1);
  newTeams[toTeamIndex].playerIds.push(playerId);

  return newTeams;
}
