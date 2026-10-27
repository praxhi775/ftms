// Every sub-metric is a number from METRIC_MIN to METRIC_MAX.
export const METRIC_MIN = 1;
export const METRIC_MAX = 100;

// Old High/Med/Low values are converted to these numbers.
const QUALITATIVE_TO_NUMBER = { High: 85, Med: 65, Medium: 65, Low: 45 };

export function clampMetric(value, fallback = 50) {
  let n = parseInt(value, 10);
  if (isNaN(n)) n = QUALITATIVE_TO_NUMBER[value] ?? fallback;
  return Math.max(METRIC_MIN, Math.min(METRIC_MAX, n));
}

export function calcCategoryAvg(metrics = []) {
  if (!metrics || metrics.length === 0) return '50 AVG';
  const sum = metrics.reduce((acc, m) => acc + (parseInt(m.value, 10) || 50), 0);
  return `${Math.round(sum / metrics.length)} AVG`;
}

// Converts any stored sub-metrics (including old qualitative ones) to numeric 1-100.
export function normalizeSubMetrics(categories = []) {
  return categories.map((cat) => {
    const metrics = (cat.metrics || []).map((m) => ({
      ...m,
      type: 'numeric',
      value: String(clampMetric(m.value)),
    }));
    return {
      ...cat,
      fieldType: 'Numeric',
      metrics,
      avg: calcCategoryAvg(metrics),
    };
  });
}

// Adds the "Agility" sub-metric to the Physical category for players saved before it existed.
// Its starting value is the category's current average, so the player's overall doesn't change.
export function ensureAgilityMetric(categories = []) {
  return categories.map((cat) => {
    const isPhysical = cat.id === 'physical' || (cat.title || '').toLowerCase() === 'physical';
    if (!isPhysical) return cat;
    const metrics = cat.metrics || [];
    if (metrics.some((m) => (m.name || '').toLowerCase() === 'agility')) return cat;

    const nums = metrics.map((m) => parseInt(m.value, 10)).filter((n) => !isNaN(n));
    const startValue = nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 50;

    return {
      ...cat,
      metrics: [
        ...metrics,
        { id: 'm13', name: 'Agility', inChart: false, value: String(clampMetric(startValue)), type: 'numeric' },
      ],
    };
  });
}