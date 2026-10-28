import { newTeamId } from '../utils/sessionUtils';

/**
 * Randomly distribute players into N teams as evenly as possible.
 * Preserves existing team names and colors if provided.
 * Returns array of team objects: [{ name: 'Team 1', color: '#...', playerIds: [...] }, ...]
 */
export function generateTeams(playerIds, numberOfTeams = 2, existingTeams = []) {
  if (!playerIds.length || numberOfTeams < 1) return [];

  // Shuffle using Fisher-Yates
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const teamNames = ['Team Green', 'Team White', 'Team Blue', 'Team Red', 'Team Gold', 'Team Purple'];
  const teamColors = ['#003B1B', '#4B5563', '#1E40AF', '#DC2626', '#D97706', '#7E22CE'];
  const teams = Array.from({ length: numberOfTeams }, (_, i) => {
    const existing = existingTeams && existingTeams[i];
    return {
      ...(existing || {}),
      id: existing?.id || newTeamId(),
      name: existing?.name || teamNames[i] || `Team ${i + 1}`,
      color: existing?.color || teamColors[i % teamColors.length],
      playerIds: [],
    };
  });

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