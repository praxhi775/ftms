import db from '../db/database';

export const playerService = {
  async getAll() {
    return db.players.toArray();
  },

  async getActive() {
    return db.players.where('status').anyOf('active', 'injured').toArray();
  },

  async getById(id) {
    return db.players.get(id);
  },

  async search(query, positionFilter = '', sortBy = 'name') {
    let collection = db.players.toCollection();
    let results = await collection.toArray();

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.jerseyNumber).includes(q)
      );
    }

    if (positionFilter) {
      results = results.filter((p) => p.position === positionFilter);
    }

    results.sort((a, b) => {
      if (sortBy === 'jerseyNumber') return a.jerseyNumber - b.jerseyNumber;
      if (sortBy === 'rating') {
        const rA = calcOverall(a.ratings);
        const rB = calcOverall(b.ratings);
        return rB - rA;
      }
      if (sortBy === 'age') {
        return (a.age || 0) - (b.age || 0);
      }
      if (sortBy === 'position') {
        const order = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
        return (order[a.position] || 99) - (order[b.position] || 99);
      }
      return a.name.localeCompare(b.name);
    });

    return results;
  },

  async add(player) {
    // Validate required fields
    if (!player.name?.trim()) throw new Error('Player name is required.');
    if (player.name.trim().length > 100) throw new Error('Player name cannot exceed 100 characters.');
    if (player.jerseyNumber == null || player.jerseyNumber === '') throw new Error('Jersey number is required.');
    if (!player.position) throw new Error('Position is required.');

    // Validate physical constraints
    if (player.height != null && player.height !== '') {
      const h = Number(player.height);
      if (isNaN(h) || h <= 100 || h >= 250) {
        throw new Error('Height must be greater than 100 cm and less than 250 cm (101–249 cm).');
      }
    }

    if (player.weight != null && player.weight !== '') {
      const w = Number(player.weight);
      if (isNaN(w) || w <= 20 || w >= 200) {
        throw new Error('Weight must be greater than 20 kg and less than 200 kg (21–199 kg).');
      }
    }

    // Check duplicate jersey number among active players
    const existing = await db.players
      .where('jerseyNumber')
      .equals(Number(player.jerseyNumber))
      .toArray();
    const conflict = existing.find((p) => p.status === 'active' || p.status === 'injured');
    if (conflict) {
      throw new Error(`Jersey number ${player.jerseyNumber} is already used by ${conflict.name}.`);
    }

    return db.players.add({
      ...player,
      name: player.name.trim(),
      jerseyNumber: Number(player.jerseyNumber),
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

    if (updates.height != null && updates.height !== '') {
      const h = Number(updates.height);
      if (isNaN(h) || h <= 100 || h >= 250) {
        throw new Error('Height must be greater than 100 cm and less than 250 cm (101–249 cm).');
      }
    }

    if (updates.weight != null && updates.weight !== '') {
      const w = Number(updates.weight);
      if (isNaN(w) || w <= 20 || w >= 200) {
        throw new Error('Weight must be greater than 20 kg and less than 200 kg (21–199 kg).');
      }
    }

    // Check duplicate jersey if jersey changed
    if (updates.jerseyNumber != null) {
      const existing = await db.players
        .where('jerseyNumber')
        .equals(Number(updates.jerseyNumber))
        .toArray();
      const conflict = existing.find(
        (p) => p.id !== id && (p.status === 'active' || p.status === 'injured')
      );
      if (conflict) {
        throw new Error(`Jersey number ${updates.jerseyNumber} is already used by ${conflict.name}.`);
      }
    }

    return db.players.update(id, {
      ...updates,
      name: updates.name != null ? updates.name.trim() : undefined,
      jerseyNumber: updates.jerseyNumber != null ? Number(updates.jerseyNumber) : undefined,
      age: updates.age != null ? Number(updates.age) : undefined,
      height: updates.height != null ? Number(updates.height) : undefined,
      weight: updates.weight != null ? Number(updates.weight) : undefined,
    });
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
};

export function calcOverall(ratings) {
  if (!ratings) return 50;
  const { pac = 50, sho = 50, pas = 50, dri = 50, def = 50, phy = 50 } = ratings;
  return Math.round(
    0.2 * pac + 0.2 * sho + 0.2 * pas + 0.15 * dri + 0.15 * def + 0.1 * phy
  );
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
