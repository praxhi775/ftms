import db from '../db/database';
import { newId, newTeamId } from '../utils/sessionUtils';
import { logActivity, logActivityCoalesced } from '../utils/activityLog';
import { lineupChanges, lineupMessage } from '../utils/activityMessages';

// Activity log for team / lineup changes. Several quick changes (dragging players around)
// become one entry; guests being added or removed are logged straight away.
async function logLineupChange(match, newTeams, newGuests) {
  const beforeTeams = match.teams || [];
  const beforeGuests = match.guestPlayers || [];
  const afterGuests = newGuests !== undefined ? newGuests : beforeGuests;

  // player names for the message
  const names = {};
  [...beforeGuests, ...afterGuests].forEach((g) => { names[g.id] = `${g.name} (guest)`; });
  const squadIds = new Set();
  [...beforeTeams, ...(newTeams || [])].forEach((t) =>
    (t.playerIds || []).forEach((pid) => { if (!(pid in names)) squadIds.add(pid); })
  );
  const ids = [...squadIds].filter((pid) => typeof pid === 'number');
  if (ids.length) {
    const rows = await db.players.bulkGet(ids);
    rows.forEach((p, i) => { if (p) names[ids[i]] = p.name; });
  }

  logActivityCoalesced(
    `lineup-${match.id}`,
    'team.lineup_updated',
    { before: beforeTeams, after: newTeams || [], ctx: { names, title: match.title } },
    (first, last, ctx) => {
      const changes = lineupChanges(first, last, (pid) => ctx.names[pid] || 'A player');
      return changes.length ? lineupMessage(ctx.title, changes) : null;
    }
  );

  if (newGuests !== undefined) {
    const beforeIds = new Set(beforeGuests.map((g) => g.id));
    const afterIds = new Set(afterGuests.map((g) => g.id));
    afterGuests.filter((g) => !beforeIds.has(g.id)).forEach((g) =>
      logActivity('guest.added', `Added guest player ${g.name} to session "${match.title}"`)
    );
    beforeGuests.filter((g) => !afterIds.has(g.id)).forEach((g) =>
      logActivity('guest.removed', `Removed guest player ${g.name} from session "${match.title}"`)
    );
  }
}

// Names used in the activity log messages
const teamNameIn = (match, teamId) => (match.teams || []).find((t) => t.id === teamId)?.name || 'a team';
const matchLabel = (session) => `"${session.name}"`;
async function playerNameFor(match, playerId) {
  const guest = (match.guestPlayers || []).find((g) => g.id === playerId);
  if (guest) return `${guest.name} (guest)`;
  const player = await db.players.get(playerId);
  return player?.name || 'a player';
}

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
    if (!match.title?.trim()) throw new Error('Session title is required.');
    if (!match.date) throw new Error('Session date is required.');

    const createdId = await db.matches.add({
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
    logActivity('session.created', `Created session "${match.title.trim()}" on ${match.date}`);
    return createdId;
  },

  async update(id, updates) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (match && match.status === 'completed') {
      throw new Error('Completed sessions cannot be edited.');
    }
    const result = await db.matches.update(targetId, updates);
    const after = await db.matches.get(targetId);
    logActivity('session.updated', `Updated session "${after?.title || match?.title || ''}"`);
    return result;
  },

  async completeMatch(id, score, notes) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const before = await db.matches.get(targetId);
    const result = await db.matches.update(targetId, {
      status: 'completed',
      score,
      notes: notes || '',
    });
    logActivity(
      'session.completed',
      `Completed session "${before?.title || ''}"${score ? ` (score ${score.home}-${score.away})` : ''}`
    );
    return result;
  },

  async saveTeams(id, teams, guestPlayers) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (match && match.status === 'completed') {
      throw new Error('Cannot reallocate players or modify lineups for a completed session.');
    }
    const updateObj = { teams };
    if (guestPlayers !== undefined) {
      updateObj.guestPlayers = guestPlayers;
    }
    const result = await db.matches.update(targetId, updateObj);
    if (match) await logLineupChange(match, teams, guestPlayers);
    return result;
  },

  // ---- Match activity log (goals, fouls) ----
  // Stored on the match record as `events`. Recording and removing are locked once
  // the match, or the session the entry belongs to, is completed.
  async addEvent(id, event) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (!match) throw new Error('Session not found.');
    if (match.status === 'completed') {
      throw new Error('Activity cannot be recorded for a completed session.');
    }
    if (!event.playerId) throw new Error('Please select a player.');
    if (!['goal', 'foul'].includes(event.type)) throw new Error('Invalid activity type.');

    if (event.sessionId) {
      const session = (match.sessions || []).find((s) => s.id === event.sessionId);
      if (!session) throw new Error('Match not found.');
      if (session.status === 'completed') {
        throw new Error(`"${session.name}" is completed. Activity can no longer be recorded for it.`);
      }
      if (session.status !== 'active') {
        throw new Error(`"${session.name}" has not started. Set it to Active to record activity.`);
      }
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
    {
      const session = (match.sessions || []).find((s) => s.id === newEvent.sessionId);
      const who = await playerNameFor(match, newEvent.playerId);
      logActivity(
        `${newEvent.type}.recorded`,
        `Recorded a ${newEvent.type} for ${who}${session ? ` in match ${matchLabel(session)}` : ''}` +
          `${newEvent.minute != null ? ` at ${newEvent.minute}'` : ''} (session "${match.title}")`
      );
    }
    return newEvent;
  },

  async removeEvent(id, eventId) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (!match) throw new Error('Session not found.');
    if (match.status === 'completed') {
      throw new Error('Activity cannot be deleted from a completed session.');
    }
    const event = (match.events || []).find((e) => e.id === eventId);
    const session = event?.sessionId ? (match.sessions || []).find((s) => s.id === event.sessionId) : null;
    if (session && session.status === 'completed') {
      throw new Error(`"${session.name}" is completed. Its activity can no longer be deleted.`);
    }
    const result = await db.matches.update(targetId, {
      events: (match.events || []).filter((e) => e.id !== eventId),
    });
    if (event) {
      const who = await playerNameFor(match, event.playerId);
      logActivity(
        `${event.type}.removed`,
        `Removed a ${event.type} for ${who}${session ? ` in match ${matchLabel(session)}` : ''} (session "${match.title}")`
      );
    }
    return result;
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
    if (!match) throw new Error('Session not found.');
    if (match.status === 'completed') {
      throw new Error('Matches are locked once the session is completed.');
    }
    return { match, targetId };
  },

  _validateSessionTeams(match, teamAId, teamBId) {
    const teams = match.teams || [];
    if (!teamAId || !teamBId) throw new Error('Please choose both teams.');
    if (teamAId === teamBId) throw new Error('A match needs two different teams.');
    if (!teams.some((t) => t.id === teamAId) || !teams.some((t) => t.id === teamBId)) {
      throw new Error('Selected team no longer exists in this session.');
    }
  },

  async addSession(id, { name, teamAId, teamBId }) {
    const { match, targetId } = await this._getOpenMatch(id);
    this._validateSessionTeams(match, teamAId, teamBId);
    const sessions = match.sessions || [];
    const session = {
      id: newId('session'),
      name: (name || '').trim() || `Match ${sessions.length + 1}`,
      teamAId,
      teamBId,
      status: 'upcoming',
      score: null,
      createdAt: new Date().toISOString(),
    };
    await db.matches.update(targetId, { sessions: [...sessions, session] });
    logActivity(
      'match.added',
      `Added match ${matchLabel(session)} (${teamNameIn(match, teamAId)} vs ${teamNameIn(match, teamBId)}) to session "${match.title}"`
    );
    return session;
  },

  async updateSession(id, sessionId, { name, teamAId, teamBId }) {
    const { match, targetId } = await this._getOpenMatch(id);
    const sessions = match.sessions || [];
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) throw new Error('Match not found.');
    this._validateSessionTeams(match, teamAId, teamBId);

    const teamsChanged = current.teamAId !== teamAId || current.teamBId !== teamBId;
    if (teamsChanged && (match.events || []).some((e) => e.sessionId === sessionId)) {
      throw new Error('Teams cannot be changed after activity has been recorded for this match.');
    }
    const updated = sessions.map((s) =>
      s.id === sessionId
        ? { ...s, name: (name || '').trim() || s.name, teamAId, teamBId }
        : s
    );
    await db.matches.update(targetId, { sessions: updated });
    logActivity(
      'match.updated',
      `Updated match ${matchLabel(updated.find((s) => s.id === sessionId))} in session "${match.title}"`
    );
  },

  async setSessionStatus(id, sessionId, status, score) {
    const { match, targetId } = await this._getOpenMatch(id);
    if (!['upcoming', 'active', 'completed'].includes(status)) throw new Error('Invalid match status.');
    const sessions = match.sessions || [];
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) throw new Error('Match not found.');

    if (status === 'completed') {
      if (!score || isNaN(Number(score.home)) || isNaN(Number(score.away))) {
        throw new Error('Please enter the final score for this match.');
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
    const label = matchLabel(current);
    if (status === 'completed') {
      logActivity(
        'match.completed',
        `Completed match ${label}: ${teamNameIn(match, current.teamAId)} ${Number(score.home)}-${Number(score.away)} ${teamNameIn(match, current.teamBId)} (session "${match.title}")`
      );
    } else if (status === 'active') {
      logActivity('match.started', `Started match ${label} (session "${match.title}")`);
    } else {
      logActivity('match.reset', `Set match ${label} back to not started (session "${match.title}")`);
    }
  },

  async removeSession(id, sessionId) {
    const { match, targetId } = await this._getOpenMatch(id);
    await db.matches.update(targetId, {
      sessions: (match.sessions || []).filter((s) => s.id !== sessionId),
      // the session's recorded goals and fouls go with it
      events: (match.events || []).filter((e) => e.sessionId !== sessionId),
    });
    const removed = (match.sessions || []).find((s) => s.id === sessionId);
    if (removed) logActivity('match.deleted', `Deleted match ${matchLabel(removed)} from session "${match.title}"`);
  },

  async remove(id) {
    const numId = Number(id);
    const targetId = isNaN(numId) ? id : numId;
    const match = await db.matches.get(targetId);
    if (match && match.status === 'completed') {
      throw new Error('Completed sessions cannot be deleted.');
    }
    const result = await db.transaction('rw', [db.matches, db.playerStats], async () => {
      await db.playerStats.where('matchId').equals(targetId).delete();
      await db.matches.delete(targetId);
    });
    logActivity('session.deleted', `Deleted session "${match?.title || ''}"`);
    return result;
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
