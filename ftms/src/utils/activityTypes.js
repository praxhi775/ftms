// Every kind of activity entry, grouped for the admin's filter.
export const ACTIVITY_CATEGORIES = [
  { id: 'account', label: 'Account' },
  { id: 'player', label: 'Players' },
  { id: 'playerstats', label: 'Player stats' },
  { id: 'team', label: 'Teams & lineups' },
  { id: 'session', label: 'Sessions' },
  { id: 'match', label: 'Matches' },
  { id: 'event', label: 'Goals & fouls' },
  { id: 'stats', label: 'Stats' },
  { id: 'backup', label: 'Backup' },
];

export const ACTIVITY_TYPES = {
  'account.registered': 'account',
  'account.login': 'account',
  'account.logout': 'account',
  'account.blocked': 'account',
  'account.unblocked': 'account',
  'player.added': 'player',
  'player.updated': 'player',
  'player.deleted': 'player',
  'player.stats_changed': 'playerstats',
  'team.lineup_updated': 'team',
  'guest.added': 'team',
  'guest.removed': 'team',
  'session.created': 'session',
  'session.updated': 'session',
  'session.completed': 'session',
  'session.deleted': 'session',
  'match.added': 'match',
  'match.updated': 'match',
  'match.started': 'match',
  'match.completed': 'match',
  'match.reset': 'match',
  'match.deleted': 'match',
  'goal.recorded': 'event',
  'goal.removed': 'event',
  'foul.recorded': 'event',
  'foul.removed': 'event',
  'stats.recorded': 'stats',
  'stat.created': 'stats',
  'stat.updated': 'stats',
  'stat.deleted': 'stats',
  'backup.exported': 'backup',
  'backup.imported': 'backup',
};

export const categoryOf = (type) => ACTIVITY_TYPES[type] || 'account';

export const categoryLabel = (categoryId) =>
  ACTIVITY_CATEGORIES.find((c) => c.id === categoryId)?.label || 'Other';
