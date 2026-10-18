import { Activity, Compass, Zap, Minus, Check, X, ClipboardList } from 'lucide-react';

const DEFAULT_CATEGORY_ICONS = {
  physical: Activity,
  tactical: Compass,
  technical: Zap,
};

export default function SubMetricBreakdown({
  categories = [],
  onChangeCategories,
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

  const handleRemoveMetric = (catId, metricId) => {
    if (!onChangeCategories) return;
    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      const filtered = cat.metrics.filter((m) => m.id !== metricId);
      // Recalculate average
      const numeric = filtered.filter((m) => m.type === 'numeric');
      let avgStr = cat.avg;
      if (numeric.length > 0) {
        const sum = numeric.reduce((acc, m) => acc + (parseInt(m.value, 10) || 50), 0);
        avgStr = `${Math.round(sum / numeric.length)} AVG`;
      }
      return {
        ...cat,
        metrics: filtered,
        avg: avgStr,
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
        <span className="submetric-calibrated-text">
          Calibrated via Matchday Analysis Tracker
        </span>
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
                        <span className="metric-numeric-val">{metric.value}</span>
                      ) : (
                        <span
                          className={`metric-qual-badge badge-${String(metric.value).toLowerCase()}`}
                        >
                          {metric.value}
                        </span>
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
