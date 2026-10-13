import db from '../db/database';

export const matchService = {
  async getAll() {
    const matches = await db.matches.toArray();
    return matches.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getById(id) {
    return db.matches.get(id);
  },

  async getUpcoming() {
    const all = await db.matches.where('status').equals('upcoming').toArray();
    return all.sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async getCompleted() {
    const all = await db.matches.where('status').equals('completed').toArray();
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getNextUpcoming() {
    const upcoming = await this.getUpcoming();
    return upcoming[0] || null;
  },

  async add(match) {
    if (!match.title?.trim()) throw new Error('Match title is required.');
    if (!match.date) throw new Error('Match date is required.');

    return db.matches.add({
      title: match.title.trim(),
      opponent: match.opponent?.trim() || '',
      date: match.date,
      time: match.time || '',
      venue: match.venue?.trim() || '',
      matchType: match.matchType || 'Friendly',
      status: 'upcoming',
      selectedPlayerIds: match.selectedPlayerIds || [],
      teams: match.teams || [],
      score: null,
      notes: match.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    });
  },

  async update(id, updates) {
    return db.matches.update(id, updates);
  },

  async completeMatch(id, score, notes) {
    return db.matches.update(id, {
      status: 'completed',
      score,
      notes: notes || '',
    });
  },

  async saveTeams(id, teams) {
    return db.matches.update(id, { teams });
  },

  async remove(id) {
    return db.transaction('rw', [db.matches, db.playerStats], async () => {
      await db.playerStats.where('matchId').equals(id).delete();
      await db.matches.delete(id);
    });
  },

  async count() {
    return db.matches.count();
  },

  async upcomingCount() {
    return db.matches.where('status').equals('upcoming').count();
  },

  async completedCount() {
    return db.matches.where('status').equals('completed').count();
  },
};
