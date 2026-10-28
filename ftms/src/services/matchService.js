import db from '../db/database';
import { newId, newTeamId } from '../utils/sessionUtils';

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

  // ---- Match activity log (goals, fouls) ----
  // Stored on the match record as `events`. Allowed on completed matches too,
  // so records can be added or corrected after the final whistle.
  async addEvent(id, event) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (!match) throw new Error('Match not found.');
    if (!event.playerId) throw new Error('Please select a player.');
    if (!['goal', 'foul'].includes(event.type)) throw new Error('Invalid activity type.');

    if (event.sessionId && !(match.sessions || []).some((s) => s.id === event.sessionId)) {
      throw new Error('Session not found.');
    }

    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: event.type,
      playerId: event.playerId,
      sessionId: event.sessionId || null,
      teamId: event.teamId || null,
      minute: event.minute === '' || event.minute == null ? null : Number(event.minute),
      createdAt: new Date().toISOString(),
    };
    await db.matches.update(targetId, { events: [...(match.events || []), newEvent] });
    return newEvent;
  },

  async removeEvent(id, eventId) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (!match) throw new Error('Match not found.');
    return db.matches.update(targetId, {
      events: (match.events || []).filter((e) => e.id !== eventId),
    });
  },

  // ---- Teams: make sure each team has a stable id (sessions refer to teams by id) ----
  async ensureTeamIds(id) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (!match) return match;
    const teams = match.teams || [];
    if (teams.every((t) => t.id)) return match;

    if (match.status === 'completed') {
      // locked match: nothing can be reshuffled any more, so positions are stable ids
      return { ...match, teams: teams.map((t, i) => (t.id ? t : { ...t, id: `team-${i}` })) };
    }
    const withIds = teams.map((t) => (t.id ? t : { ...t, id: newTeamId() }));
    await db.matches.update(targetId, { teams: withIds });
    return { ...match, teams: withIds };
  },

  // ---- Sessions (league-style fixtures between two teams of this match) ----
  async _getOpenMatch(id) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (!match) throw new Error('Match not found.');
    if (match.status === 'completed') {
      throw new Error('Sessions are locked once the match is completed.');
    }
    return { match, targetId };
  },

  _validateSessionTeams(match, teamAId, teamBId) {
    const teams = match.teams || [];
    if (!teamAId || !teamBId) throw new Error('Please choose both teams.');
    if (teamAId === teamBId) throw new Error('A session needs two different teams.');
    if (!teams.some((t) => t.id === teamAId) || !teams.some((t) => t.id === teamBId)) {
      throw new Error('Selected team no longer exists in this match.');
    }
  },

  async addSession(id, { name, teamAId, teamBId }) {
    const { match, targetId } = await this._getOpenMatch(id);
    this._validateSessionTeams(match, teamAId, teamBId);
    const sessions = match.sessions || [];
    const session = {
      id: newId('session'),
      name: (name || '').trim() || `Session ${sessions.length + 1}`,
      teamAId,
      teamBId,
      status: 'upcoming',
      score: null,
      createdAt: new Date().toISOString(),
    };
    await db.matches.update(targetId, { sessions: [...sessions, session] });
    return session;
  },

  async updateSession(id, sessionId, { name, teamAId, teamBId }) {
    const { match, targetId } = await this._getOpenMatch(id);
    const sessions = match.sessions || [];
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) throw new Error('Session not found.');
    this._validateSessionTeams(match, teamAId, teamBId);

    const teamsChanged = current.teamAId !== teamAId || current.teamBId !== teamBId;
    if (teamsChanged && (match.events || []).some((e) => e.sessionId === sessionId)) {
      throw new Error('Teams cannot be changed after activity has been recorded for this session.');
    }
    const updated = sessions.map((s) =>
      s.id === sessionId
        ? { ...s, name: (name || '').trim() || s.name, teamAId, teamBId }
        : s
    );
    await db.matches.update(targetId, { sessions: updated });
  },

  async setSessionStatus(id, sessionId, status, score) {
    const { match, targetId } = await this._getOpenMatch(id);
    if (!['upcoming', 'active', 'completed'].includes(status)) throw new Error('Invalid session status.');
    const sessions = match.sessions || [];
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) throw new Error('Session not found.');

    if (status === 'active') {
      const other = sessions.find((s) => s.status === 'active' && s.id !== sessionId);
      if (other) {
        throw new Error(`"${other.name}" is already active. Complete it or set it back to upcoming first.`);
      }
    }
    if (status === 'completed') {
      if (!score || isNaN(Number(score.home)) || isNaN(Number(score.away))) {
        throw new Error('Please enter the final score for this session.');
      }
    }

    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        status,
        score: status === 'completed' ? { home: Number(score.home), away: Number(score.away) } : null,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      };
    });
    await db.matches.update(targetId, { sessions: updated });
  },

  async removeSession(id, sessionId) {
    const { match, targetId } = await this._getOpenMatch(id);
    await db.matches.update(targetId, {
      sessions: (match.sessions || []).filter((s) => s.id !== sessionId),
      // the session's recorded goals and fouls go with it
      events: (match.events || []).filter((e) => e.sessionId !== sessionId),
    });
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