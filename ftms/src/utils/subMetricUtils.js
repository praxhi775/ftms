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