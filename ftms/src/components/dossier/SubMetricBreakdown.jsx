import { Activity, Compass, Zap, Minus, Check, X, ClipboardList, SlidersHorizontal } from 'lucide-react';

const DEFAULT_CATEGORY_ICONS = {
  physical: Activity,
  tactical: Compass,
  technical: Zap,
};

export default function SubMetricBreakdown({
  categories = [],
  onChangeCategories,
  onOpenEditRatings,
}) {
  const handleToggleChart = (catId, metricId) => {
    if (!onChangeCategories) return;
    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        metrics: cat.metrics.map((m) =>
          m.id === metricId ? { ...m, inChart: !m.inChart } : m
        ),
      };
    });
    onChangeCategories(updated);
  };

  const calcCategoryAvg = (metrics) => {
    if (!metrics || metrics.length === 0) return '50 AVG';
    const numeric = metrics.filter((m) => m.type === 'numeric');
    if (numeric.length > 0) {
      const sum = numeric.reduce((acc, m) => acc + (parseInt(m.value, 10) || 50), 0);
      return `${Math.round(sum / numeric.length)} AVG`;
    }
    const sum = metrics.reduce((acc, m) => {
      const qVal = m.value === 'High' ? 85 : m.value === 'Low' ? 45 : 65;
      return acc + qVal;
    }, 0);
    return `${Math.round(sum / metrics.length)} AVG`;
  };

  const handleNumericChange = (catId, metricId, rawVal) => {
    if (!onChangeCategories) return;
    let num = parseInt(rawVal, 10);
    if (isNaN(num)) num = '';
    else num = Math.max(1, Math.min(99, num));

    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      const updatedMetrics = cat.metrics.map((m) =>
        m.id === metricId ? { ...m, value: num } : m
      );
      return {
        ...cat,
        metrics: updatedMetrics,
        avg: calcCategoryAvg(updatedMetrics),
      };
    });
    onChangeCategories(updated);
  };

  const handleQualitativeCycle = (catId, metricId, currentVal) => {
    if (!onChangeCategories) return;
    const cycle = { High: 'Med', Med: 'Low', Low: 'High' };
    const nextVal = cycle[currentVal] || 'High';

    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      const updatedMetrics = cat.metrics.map((m) =>
        m.id === metricId ? { ...m, value: nextVal } : m
      );
      return {
        ...cat,
        metrics: updatedMetrics,
        avg: calcCategoryAvg(updatedMetrics),
      };
    });
    onChangeCategories(updated);
  };

  const handleRemoveMetric = (catId, metricId) => {
    if (!onChangeCategories) return;
    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      const filtered = cat.metrics.filter((m) => m.id !== metricId);
      return {
        ...cat,
        metrics: filtered,
        avg: calcCategoryAvg(filtered),
      };
    });
    onChangeCategories(updated);
  };

  return (
    <section className="submetric-section-card" aria-labelledby="submetrics-heading">
      <div className="submetric-section-header">
        <div className="submetric-title-group">
          <ClipboardList size={18} className="submetric-icon" strokeWidth={2.4} />
          <h2 id="submetrics-heading" className="submetric-main-title">
            Category Sub-Metric Breakdown
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="submetric-calibrated-text">
            Calibrated via Matchday Analysis Tracker
          </span>
          {onOpenEditRatings && (
            <button
              type="button"
              className="btn-submetric-modal-edit"
              onClick={onOpenEditRatings}
              title="Open full ratings editor modal"
            >
              <SlidersHorizontal size={13} strokeWidth={2.2} />
              <span>Edit Ratings</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Three-Column Grid */}
      <div className="submetric-columns-grid">
        {categories.map((cat) => {
          const Icon = DEFAULT_CATEGORY_ICONS[cat.id] || Activity;
          return (
            <article key={cat.id} className="category-metric-card" aria-labelledby={`cat-title-${cat.id}`}>
              {/* Category Top Banner */}
              <div className="category-card-top">
                <div className="category-title-row">
                  <Icon size={16} strokeWidth={2.2} className="cat-icon" />
                  <h3 id={`cat-title-${cat.id}`} className="category-name">{cat.title}</h3>
                </div>
                <span className="category-avg-badge">{cat.avg}</span>
              </div>

              {/* Rows List */}
              <div className="metric-rows-list" role="list">
                {cat.metrics.map((metric) => (
                  <div key={metric.id} className="submetric-row" role="listitem">
                    {/* Remove Action */}
                    <button
                      type="button"
                      className="btn-remove-metric"
                      onClick={() => handleRemoveMetric(cat.id, metric.id)}
                      aria-label={`Remove ${metric.name} from ${cat.title}`}
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>

                    {/* Metric Name */}
                    <span className="submetric-name">{metric.name}</span>

                    {/* Chart / Off Toggle */}
                    <button
                      type="button"
                      className={`btn-chart-toggle ${
                        metric.inChart ? 'chart-active' : 'chart-off'
                      }`}
                      onClick={() => handleToggleChart(cat.id, metric.id)}
                      aria-label={`${metric.name} radar display: ${metric.inChart ? 'Chart active' : 'Off'}. Press to toggle.`}
                      aria-pressed={metric.inChart}
                    >
                      {metric.inChart ? (
                        <>
                          <Check size={11} strokeWidth={3} />
                          <span>Chart</span>
                        </>
                      ) : (
                        <>
                          <X size={11} strokeWidth={2.5} />
                          <span>Off</span>
                        </>
                      )}
                    </button>

                    {/* Value Badge or Number */}
                    <div className="submetric-val-col">
                      {metric.type === 'numeric' ? (
                        <input
                          type="number"
                          min="1"
                          max="99"
                          className="metric-numeric-input"
                          value={metric.value}
                          onChange={(e) => handleNumericChange(cat.id, metric.id, e.target.value)}
                          aria-label={`${metric.name} rating value`}
                          title="Click to edit rating (1-99)"
                        />
                      ) : (
                        <button
                          type="button"
                          className={`metric-qual-badge badge-${String(metric.value).toLowerCase()} clickable-qual-badge`}
                          onClick={() => handleQualitativeCycle(cat.id, metric.id, metric.value)}
                          title={`Current: ${metric.value}. Click to cycle High / Med / Low`}
                          aria-label={`${metric.name}: ${metric.value}. Click to cycle.`}
                        >
                          {metric.value}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
