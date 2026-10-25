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
        return calcOverall(b) - calcOverall(a);
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

    const initialRatings = player.ratings || { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 };
    return db.players.add({
      ...player,
      name: player.name.trim(),
      jerseyNumber: normalizeJersey(player.jerseyNumber),
      age: player.age ? Number(player.age) : null,
      height: player.height ? Number(player.height) : null,
      weight: player.weight ? Number(player.weight) : null,
      status: player.status || 'active',
      ratings: initialRatings,
      subMetrics: player.subMetrics || deriveSubMetricsFromRatings(initialRatings),
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

export function calcOverall(ratingsOrPlayer) {
  if (!ratingsOrPlayer) return 50;

  // 1. If a player object with subMetrics is passed, calculate overall from numeric subMetrics
  const subMetrics = ratingsOrPlayer.subMetrics;
  if (subMetrics && Array.isArray(subMetrics) && subMetrics.length > 0) {
    const numeric = subMetrics.flatMap((c) =>
      (c.metrics || []).filter((m) => m.type === 'numeric')
    );
    if (numeric.length > 0) {
      const sum = numeric.reduce((acc, m) => acc + (parseInt(m.value, 10) || 50), 0);
      return Math.round(sum / numeric.length);
    }
  }

  // 2. Otherwise calculate from 6 FIFA attributes
  const ratings = ratingsOrPlayer.ratings || ratingsOrPlayer;
  const { pac = 50, sho = 50, pas = 50, dri = 50, def = 50, phy = 50 } = ratings;
  return Math.round(
    0.2 * pac + 0.2 * sho + 0.2 * pas + 0.15 * dri + 0.15 * def + 0.1 * phy
  );
}

export function deriveSubMetricsFromRatings(ratings = {}) {
  const pac = ratings.pac ?? 50;
  const sho = ratings.sho ?? 50;
  const pas = ratings.pas ?? 50;
  const dri = ratings.dri ?? 50;
  const def = ratings.def ?? 50;
  const phy = ratings.phy ?? 50;

  const getQual = (val) => (val >= 75 ? 'High' : val >= 60 ? 'Med' : 'Low');

  const physAvg = Math.round((pac + pac) / 2);
  const tactAvg = pas;
  const techAvg = Math.round((dri + pas + sho) / 3);

  return [
    {
      id: 'physical',
      title: 'Physical',
      avg: `${physAvg} AVG`,
      fieldType: 'Numeric',
      metrics: [
        { id: 'm1', name: 'Sprint Speed', inChart: true, value: String(pac), type: 'numeric' },
        { id: 'm2', name: 'Acceleration', inChart: true, value: String(pac), type: 'numeric' },
        { id: 'm3', name: 'Stamina', inChart: false, value: getQual(phy), type: 'qualitative' },
        { id: 'm4', name: 'Strength', inChart: false, value: getQual(phy), type: 'qualitative' },
      ],
    },
    {
      id: 'tactical',
      title: 'Tactical',
      avg: `${tactAvg} AVG`,
      fieldType: 'High/Med/Low',
      metrics: [
        { id: 'm5', name: 'Vision', inChart: true, value: String(pas), type: 'numeric' },
        { id: 'm6', name: 'Positioning', inChart: false, value: getQual(def), type: 'qualitative' },
        { id: 'm7', name: 'Decision Making', inChart: false, value: getQual(pas), type: 'qualitative' },
        { id: 'm8', name: 'Press Resistance', inChart: false, value: getQual(def), type: 'qualitative' },
      ],
    },
    {
      id: 'technical',
      title: 'Technical',
      avg: `${techAvg} AVG`,
      fieldType: 'Numeric',
      metrics: [
        { id: 'm9', name: 'Ball Control', inChart: true, value: String(dri), type: 'numeric' },
        { id: 'm10', name: 'Short Passing', inChart: true, value: String(pas), type: 'numeric' },
        { id: 'm11', name: 'Finishing', inChart: true, value: String(sho), type: 'numeric' },
        { id: 'm12', name: 'First Touch', inChart: false, value: getQual(dri), type: 'qualitative' },
      ],
    },
  ];
}

export function deriveRatingsFromSubMetrics(categories, existingRatings = {}) {
  if (!categories || !Array.isArray(categories)) {
    return existingRatings || { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 };
  }

  const qualToNum = (val) => (val === 'High' ? 82 : val === 'Low' ? 48 : 65);

  const allMetrics = categories.flatMap((c) => c.metrics || []);
  const findMetricVal = (nameRegex) => {
    const match = allMetrics.find((m) => nameRegex.test(m.name));
    if (!match) return null;
    if (match.type === 'numeric') {
      const n = parseInt(match.value, 10);
      return !isNaN(n) ? n : null;
    }
    return qualToNum(match.value);
  };

  const sprintSpeed = findMetricVal(/sprint/i);
  const acceleration = findMetricVal(/accel/i);
  const finishing = findMetricVal(/finish/i);
  const shot = findMetricVal(/shot|shoot/i);
  const shortPassing = findMetricVal(/short pass|passing/i);
  const vision = findMetricVal(/vision/i);
  const ballControl = findMetricVal(/ball control/i);
  const firstTouch = findMetricVal(/first touch/i);
  const positioning = findMetricVal(/position/i);
  const stamina = findMetricVal(/stamina/i);
  const strength = findMetricVal(/strength/i);
  const pressResist = findMetricVal(/press/i);

  const getCatNumericAvg = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return null;
    const nums = (cat.metrics || []).filter((m) => m.type === 'numeric');
    if (nums.length === 0) return null;
    const sum = nums.reduce((acc, m) => acc + (parseInt(m.value, 10) || 50), 0);
    return Math.round(sum / nums.length);
  };

  const physAvg = getCatNumericAvg('physical') ?? existingRatings.phy ?? 50;
  const tactAvg = getCatNumericAvg('tactical') ?? existingRatings.pas ?? 50;
  const techAvg = getCatNumericAvg('technical') ?? existingRatings.dri ?? 50;

  let pac;
  const pacVals = [sprintSpeed, acceleration].filter((v) => v !== null);
  if (pacVals.length > 0) {
    pac = Math.round(pacVals.reduce((a, b) => a + b, 0) / pacVals.length);
  } else {
    pac = physAvg;
  }

  let sho;
  const shoVals = [finishing, shot].filter((v) => v !== null);
  if (shoVals.length > 0) {
    sho = Math.round(shoVals.reduce((a, b) => a + b, 0) / shoVals.length);
  } else {
    sho = techAvg;
  }

  let pas;
  const pasVals = [shortPassing, vision].filter((v) => v !== null);
  if (pasVals.length > 0) {
    pas = Math.round(pasVals.reduce((a, b) => a + b, 0) / pasVals.length);
  } else {
    pas = tactAvg;
  }

  let dri;
  const driVals = [ballControl, firstTouch].filter((v) => v !== null);
  if (driVals.length > 0) {
    dri = Math.round(driVals.reduce((a, b) => a + b, 0) / driVals.length);
  } else {
    dri = techAvg;
  }

  let def;
  const defVals = [positioning, pressResist].filter((v) => v !== null);
  if (defVals.length > 0) {
    def = Math.round(defVals.reduce((a, b) => a + b, 0) / defVals.length);
  } else {
    def = tactAvg;
  }

  let phy;
  const phyVals = [stamina, strength].filter((v) => v !== null);
  if (phyVals.length > 0) {
    phy = Math.round(phyVals.reduce((a, b) => a + b, 0) / phyVals.length);
  } else {
    phy = physAvg;
  }

  const derived = {
    pac: Math.max(1, Math.min(99, pac)),
    sho: Math.max(1, Math.min(99, sho)),
    pas: Math.max(1, Math.min(99, pas)),
    dri: Math.max(1, Math.min(99, dri)),
    def: Math.max(1, Math.min(99, def)),
    phy: Math.max(1, Math.min(99, phy)),
  };

  // Align weighted 6-stat overall with submetric overall average
  const numericMetrics = allMetrics.filter((m) => m.type === 'numeric');
  if (numericMetrics.length > 0) {
    const targetOvr = Math.round(
      numericMetrics.reduce((acc, m) => acc + (parseInt(m.value, 10) || 50), 0) / numericMetrics.length
    );
    const currentCalc = calcOverall(derived);
    const diff = targetOvr - currentCalc;
    if (diff !== 0) {
      // Adjust attributes evenly by the difference so calcOverall(derived) === targetOvr
      derived.pac = Math.max(1, Math.min(99, derived.pac + diff));
      derived.sho = Math.max(1, Math.min(99, derived.sho + diff));
      derived.pas = Math.max(1, Math.min(99, derived.pas + diff));
      derived.dri = Math.max(1, Math.min(99, derived.dri + diff));
      derived.def = Math.max(1, Math.min(99, derived.def + diff));
      derived.phy = Math.max(1, Math.min(99, derived.phy + diff));
    }
  }

  return derived;
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