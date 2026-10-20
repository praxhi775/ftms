import db from '../db/database';

export const matchService = {
  async getAll() {
    const matches = await db.matches.toArray();
    return matches.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getById(id) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    return db.matches.get(targetId);
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
      status: match.status || 'upcoming',
      selectedPlayerIds: match.selectedPlayerIds || [],
      teams: match.teams || [],
      guestPlayers: match.guestPlayers || [],
      score: match.score || null,
      notes: match.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    });
  },

  async update(id, updates) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (match && match.status === 'completed') {
      throw new Error('Completed matches cannot be edited.');
    }
    return db.matches.update(targetId, updates);
  },

  async completeMatch(id, score, notes) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    return db.matches.update(targetId, {
      status: 'completed',
      score,
      notes: notes || '',
    });
  },

  async saveTeams(id, teams, guestPlayers) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (match && match.status === 'completed') {
      throw new Error('Cannot reallocate players or modify lineups for a completed match.');
    }
    const updateObj = { teams };
    if (guestPlayers !== undefined) {
      updateObj.guestPlayers = guestPlayers;
    }
    return db.matches.update(targetId, updateObj);
  },

  async remove(id) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (match && match.status === 'completed') {
      throw new Error('Completed matches cannot be deleted.');
    }
    return db.transaction('rw', [db.matches, db.playerStats], async () => {
      await db.playerStats.where('matchId').equals(targetId).delete();
      await db.matches.delete(targetId);
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
