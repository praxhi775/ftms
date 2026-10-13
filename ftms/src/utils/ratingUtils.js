export function calculateOverall(ratings) {
  if (!ratings) return 50;
  const { pac = 50, sho = 50, pas = 50, dri = 50, def = 50, phy = 50 } = ratings;
  return Math.round(
    0.2 * pac + 0.2 * sho + 0.2 * pas + 0.15 * dri + 0.15 * def + 0.1 * phy
  );
}

export function formatPosition(pos) {
  switch (pos) {
    case 'GK': return 'Goalkeeper';
    case 'DEF': return 'Defender';
    case 'MID': return 'Midfielder';
    case 'FWD': return 'Forward';
    default: return pos || 'Player';
  }
}
