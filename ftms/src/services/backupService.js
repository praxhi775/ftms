import db from '../db/database';

export const backupService = {
  /**
   * Export all application data as a JSON object
   */
  async exportData() {
    const [players, matches, statDefinitions, playerStats, settings] = await Promise.all([
      db.players.toArray(),
      db.matches.toArray(),
      db.statDefinitions.toArray(),
      db.playerStats.toArray(),
      db.settings.toArray(),
    ]);

    const backup = {
      schemaVersion: 1,
      appName: 'FootballTeamManager',
      exportedAt: new Date().toISOString(),
      data: {
        players,
        matches,
        statDefinitions,
        playerStats,
        settings,
      },
    };

    return backup;
  },

  /**
   * Download the backup JSON file to client browser
   */
  async downloadBackup() {
    const backup = await this.exportData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ftms-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Record last backup timestamp in settings
    await db.settings.put({ key: 'lastBackup', value: new Date().toISOString() });
    return backup;
  },

  /**
   * Validate uploaded backup JSON
   */
  validateBackup(json) {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid JSON format: file does not contain a valid JSON object.');
    }

    if (!json.schemaVersion || !json.data) {
      throw new Error('Incompatible backup file: missing schemaVersion or data container.');
    }

    const { players, matches, statDefinitions, playerStats } = json.data;
    if (!Array.isArray(players) || !Array.isArray(matches)) {
      throw new Error('Invalid backup data structure: players and sessions must be lists.');
    }

    return {
      isValid: true,
      schemaVersion: json.schemaVersion,
      exportedAt: json.exportedAt || 'Unknown',
      summary: {
        playersCount: players.length,
        matchesCount: matches.length,
        statDefinitionsCount: Array.isArray(statDefinitions) ? statDefinitions.length : 0,
        playerStatsCount: Array.isArray(playerStats) ? playerStats.length : 0,
      },
    };
  },

  /**
   * Restore database from backup using transaction replacement strategy
   */
  async restoreData(backupJson) {
    this.validateBackup(backupJson);

    const { players = [], matches = [], statDefinitions = [], playerStats = [], settings = [] } = backupJson.data;

    await db.transaction('rw', [db.players, db.matches, db.statDefinitions, db.playerStats, db.settings], async () => {
      // Clear existing records
      await Promise.all([
        db.players.clear(),
        db.matches.clear(),
        db.statDefinitions.clear(),
        db.playerStats.clear(),
        db.settings.clear(),
      ]);

      // Bulk add restored data
      if (players.length) await db.players.bulkAdd(players);
      if (matches.length) await db.matches.bulkAdd(matches);
      if (statDefinitions.length) await db.statDefinitions.bulkAdd(statDefinitions);
      if (playerStats.length) await db.playerStats.bulkAdd(playerStats);
      if (settings.length) await db.settings.bulkAdd(settings);

      // Record last restored setting
      await db.settings.put({ key: 'lastRestored', value: new Date().toISOString() });
    });

    return true;
  },

  /**
   * Get metadata info about storage and last backup
   */
  async getStorageInfo() {
    const lastBackupSetting = await db.settings.get('lastBackup');
    const lastRestoredSetting = await db.settings.get('lastRestored');
    const [playersCount, matchesCount, statsCount] = await Promise.all([
      db.players.count(),
      db.matches.count(),
      db.playerStats.count(),
    ]);

    return {
      playersCount,
      matchesCount,
      statsCount,
      lastBackup: lastBackupSetting ? lastBackupSetting.value : null,
      lastRestored: lastRestoredSetting ? lastRestoredSetting.value : null,
    };
  },
};