import db from '../db/database';

const POSITION_ORDER = { GK: 1, DEF: 2, MID: 3, FWD: 4 };

// Normalises jersey number input: '' / null -> null, numeric -> Number, otherwise keep as-is.
function normalizeJersey(value) {
  if (value === '' || value == null) return null;
  return !isNaN(Number(value)) ? Number(value) : value;
}

function validatePhysical({ height, weight }) {
  if (height != null && height !== '') {
    const h = Number(height);
    if (isNaN(h) || h <= 100 || h >= 250) {
      throw new Error('Height must be greater than 100 cm and less than 250 cm (101–249 cm).');
    }
  }

  if (weight != null && weight !== '') {
    const w = Number(weight);
    if (isNaN(w) || w <= 20 || w >= 200) {
      throw new Error('Weight must be greater than 20 kg and less than 200 kg (21–199 kg).');
    }
  }
}

export const playerService = {
  async getAll() {
    const all = await db.players.toArray();
    // Skip corrupted records (missing name) so UI code never crashes on them
    return all.filter((p) => p && typeof p.name === 'string');
  },

  async getActive() {
    const list = await db.players.where('status').anyOf('active', 'injured').toArray();
    return list.filter((p) => p && typeof p.name === 'string');
  },

  async getById(id) {
    return db.players.get(id);
  },

  async search(query, positionFilter = '', sortBy = 'name') {
    let results = (await db.players.toArray()).filter(
      (p) => p && typeof p.name === 'string'
    );

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.jerseyNumber != null && String(p.jerseyNumber).includes(q))
      );
    }

    if (positionFilter) {
      results = results.filter((p) => p.position === positionFilter);
    }

    results.sort((a, b) => {
      if (sortBy === 'jerseyNumber') {
        const jA = Number(a.jerseyNumber);
        const jB = Number(b.jerseyNumber);
        // Players without a (numeric) jersey number go last
        const nA = isNaN(jA) || a.jerseyNumber == null || a.jerseyNumber === '' ? Infinity : jA;
        const nB = isNaN(jB) || b.jerseyNumber == null || b.jerseyNumber === '' ? Infinity : jB;
        if (nA === nB) return 0;
        return nA < nB ? -1 : 1;
      }
      if (sortBy === 'rating') {
        return calcOverall(b.ratings) - calcOverall(a.ratings);
      }
      if (sortBy === 'age') {
        return (a.age || 0) - (b.age || 0);
      }
      if (sortBy === 'position') {
        return (POSITION_ORDER[a.position] || 99) - (POSITION_ORDER[b.position] || 99);
      }
      return a.name.localeCompare(b.name);
    });

    return results;
  },

  async add(player) {
    // Validate required fields
    if (!player.name?.trim()) throw new Error('Player name is required.');
    if (player.name.trim().length > 100) throw new Error('Player name cannot exceed 100 characters.');
    if (!player.position) throw new Error('Position is required.');

    validatePhysical(player);

    return db.players.add({
      ...player,
      name: player.name.trim(),
      jerseyNumber: normalizeJersey(player.jerseyNumber),
      age: player.age ? Number(player.age) : null,
      height: player.height ? Number(player.height) : null,
      weight: player.weight ? Number(player.weight) : null,
      status: player.status || 'active',
      ratings: player.ratings || { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 },
      createdAt: new Date().toISOString(),
    });
  },

  async update(id, updates) {
    if (updates.name != null) {
      if (!updates.name.trim()) throw new Error('Player name is required.');
      if (updates.name.trim().length > 100) throw new Error('Player name cannot exceed 100 characters.');
    }

    validatePhysical(updates);

    // Only include fields that were actually provided.
    // Passing `undefined` to Dexie's update() DELETES that property from the record.
    const patch = { ...updates };

    if (updates.name != null) patch.name = updates.name.trim();
    if (updates.jerseyNumber !== undefined) patch.jerseyNumber = normalizeJersey(updates.jerseyNumber);
    if (updates.age != null) patch.age = Number(updates.age);
    if (updates.height != null) patch.height = Number(updates.height);
    if (updates.weight != null) patch.weight = Number(updates.weight);

    // Drop any key whose value is undefined, as a final safety net
    Object.keys(patch).forEach((key) => {
      if (patch[key] === undefined) delete patch[key];
    });

    return db.players.update(id, patch);
  },

  async remove(id) {
    return db.players.delete(id);
  },

  async count() {
    return db.players.count();
  },

  async getActiveCount() {
    const all = await db.players.toArray();
    return all.filter((p) => p.status === 'active' || p.status === 'injured').length;
  },

  // One-off cleanup: deletes records already corrupted (missing/blank name).
  // Run once from the console or temporarily on app startup:
  //   await playerService.removeCorrupted();
  async removeCorrupted() {
    const bad = await db.players
      .filter((p) => !p || typeof p.name !== 'string' || !p.name.trim())
      .toArray();
    console.log('Removing corrupted players:', bad);
    await db.players.bulkDelete(bad.map((p) => p.id));
    return bad.length;
  },
};

export function calcOverall(ratings) {
  if (!ratings) return 50;
  const { pac = 50, sho = 50, pas = 50, dri = 50, def = 50, phy = 50 } = ratings;
  return Math.round(
    0.2 * pac + 0.2 * sho + 0.2 * pas + 0.15 * dri + 0.15 * def + 0.1 * phy
  );
}

export function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}