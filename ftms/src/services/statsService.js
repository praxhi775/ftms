import db from '../db/database';

export const statsService = {
  // ---- Stat Definitions ----
  async getAllDefinitions() {
    return db.statDefinitions.toArray();
  },

  async getDefinition(id) {
    return db.statDefinitions.get(id);
  },

  async getChartDefinitions() {
    return db.statDefinitions.where('inChart').equals(1).toArray();
  },

  async addDefinition(def) {
    if (!def.name?.trim()) throw new Error('Stat name is required.');
    if (!def.type) throw new Error('Stat type is required.');

    return db.statDefinitions.add({
      name: def.name.trim(),
      description: def.description?.trim() || '',
      category: def.category?.trim() || 'General',
      type: def.type,
      unit: def.unit?.trim() || '',
      inChart: def.inChart ? 1 : 0,
      choices: def.type === 'qualitative' ? (def.choices || []) : [],
    });
  },

  async updateDefinition(id, updates) {
    const data = { ...updates };
    if (data.inChart !== undefined) data.inChart = data.inChart ? 1 : 0;
    if (data.category) data.category = data.category.trim();
    return db.statDefinitions.update(id, data);
  },

  async removeDefinition(id) {
    return db.transaction('rw', [db.statDefinitions, db.playerStats], async () => {
      await db.playerStats.where('statDefId').equals(id).delete();
      await db.statDefinitions.delete(id);
    });
  },

  // ---- Player Stats ----
  async getStatsForMatch(matchId) {
    return db.playerStats.where('matchId').equals(matchId).toArray();
  },

  async getStatsForPlayer(playerId) {
    return db.playerStats.where('playerId').equals(playerId).toArray();
  },

  async getStatsForMatchPlayer(matchId, playerId) {
    return db.playerStats
      .where('[matchId+playerId]')
      .equals([matchId, playerId])
      .toArray();
  },

  async saveStat(matchId, playerId, statDefId, value) {
    // Upsert: find existing or create
    const existing = await db.playerStats
      .where('[matchId+playerId]')
      .equals([matchId, playerId])
      .and((s) => s.statDefId === statDefId)
      .first();

    if (existing) {
      return db.playerStats.update(existing.id, { value: String(value) });
    }

    return db.playerStats.add({
      matchId,
      playerId,
      statDefId,
      value: String(value),
    });
  },

  async saveMatchStats(matchId, statsArray) {
    // statsArray: [{ playerId, statDefId, value }]
    return db.transaction('rw', db.playerStats, async () => {
      for (const stat of statsArray) {
        await statsService.saveStat(matchId, stat.playerId, stat.statDefId, stat.value);
      }
    });
  },

  // ---- Aggregations ----
  async getTotalGoals() {
    const goalsDef = await db.statDefinitions.where('name').equals('Goals').first();
    if (!goalsDef) return 0;

    const goalStats = await db.playerStats
      .where('statDefId')
      .equals(goalsDef.id)
      .toArray();

    return goalStats.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  },

  async getPlayerStatsSummary(playerId) {
    const stats = await this.getStatsForPlayer(playerId);
    const defs = await this.getAllDefinitions();
    const defMap = {};
    defs.forEach((d) => { defMap[d.id] = d; });

    const summary = {};
    stats.forEach((s) => {
      const def = defMap[s.statDefId];
      if (!def) return;
      if (!summary[def.name]) {
        summary[def.name] = { def, values: [] };
      }
      summary[def.name].values.push({ matchId: s.matchId, value: s.value });
    });

    return summary;
  },

  async getChartData() {
    const chartDefs = await db.statDefinitions.toArray();
    const activeDefs = chartDefs.filter((d) => d.inChart === 1);
    if (!activeDefs.length) return [];

    const allStats = await db.playerStats.toArray();
    const players = await db.players.toArray();
    const matches = await db.matches.where('status').equals('completed').toArray();

    const playerMap = {};
    players.forEach((p) => { playerMap[p.id] = p; });
    const matchMap = {};
    matches.forEach((m) => { matchMap[m.id] = m; });

    return activeDefs.map((def) => {
      const defStats = allStats.filter((s) => s.statDefId === def.id);

      if (def.type === 'quantitative') {
        // Group by player for bar chart
        const playerTotals = {};
        defStats.forEach((s) => {
          if (!playerTotals[s.playerId]) playerTotals[s.playerId] = 0;
          playerTotals[s.playerId] += Number(s.value) || 0;
        });

        const barData = Object.entries(playerTotals)
          .map(([pid, total]) => ({
            name: playerMap[Number(pid)]?.name || 'Unknown',
            value: total,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        // Over time by match
        const matchOrder = matches.sort((a, b) => new Date(a.date) - new Date(b.date));
        const timeData = matchOrder.map((m) => {
          const entry = { match: m.title || m.date };
          defStats
            .filter((s) => s.matchId === m.id)
            .forEach((s) => {
              const pName = playerMap[s.playerId]?.name || 'Unknown';
              entry[pName] = Number(s.value) || 0;
            });
          return entry;
        });

        return { def, barData, timeData };
      }

      // Qualitative - distribution
      const distribution = {};
      defStats.forEach((s) => {
        distribution[s.value] = (distribution[s.value] || 0) + 1;
      });
      const barData = Object.entries(distribution).map(([label, count]) => ({
        name: label,
        value: count,
      }));

      return { def, barData, timeData: [] };
    });
  },
};
