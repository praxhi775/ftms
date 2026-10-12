import { useState } from 'react';
import { Activity, Compass, Zap, Plus, Minus, Check, X, ClipboardList } from 'lucide-react';

const INITIAL_CATEGORIES = [
  {
    id: 'physical',
    title: 'Physical',
    avg: '81 AVG',
    icon: Activity,
    fieldType: 'Numeric',
    metrics: [
      { id: 'm1', name: 'Sprint Speed', inChart: true, value: '84', type: 'numeric' },
      { id: 'm2', name: 'Acceleration', inChart: true, value: '80', type: 'numeric' },
      { id: 'm3', name: 'Stamina', inChart: false, value: 'High', type: 'qualitative' },
      { id: 'm4', name: 'Strength', inChart: false, value: 'Med', type: 'qualitative' },
    ],
  },
  {
    id: 'tactical',
    title: 'Tactical',
    avg: '80 AVG',
    icon: Compass,
    fieldType: 'High/Med/Low',
    metrics: [
      { id: 'm5', name: 'Vision', inChart: true, value: '82', type: 'numeric' },
      { id: 'm6', name: 'Positioning', inChart: false, value: 'High', type: 'qualitative' },
      { id: 'm7', name: 'Decision Making', inChart: false, value: 'High', type: 'qualitative' },
      { id: 'm8', name: 'Press Resistance', inChart: false, value: 'Med', type: 'qualitative' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical',
    avg: '85 AVG',
    icon: Zap,
    fieldType: 'Numeric',
    metrics: [
      { id: 'm9', name: 'Ball Control', inChart: true, value: '86', type: 'numeric' },
      { id: 'm10', name: 'Short Passing', inChart: true, value: '81', type: 'numeric' },
      { id: 'm11', name: 'Finishing', inChart: true, value: '88', type: 'numeric' },
      { id: 'm12', name: 'First Touch', inChart: false, value: 'High', type: 'qualitative' },
    ],
  },
];

export default function SubMetricBreakdown() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);

  const handleToggleChart = (catId, metricId) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          metrics: cat.metrics.map((m) =>
            m.id === metricId ? { ...m, inChart: !m.inChart } : m
          ),
        };
      })
    );
  };

  const handleRemoveMetric = (catId, metricId) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          metrics: cat.metrics.filter((m) => m.id !== metricId),
        };
      })
    );
  };

  const handleChangeFieldType = (catId, newType) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === catId ? { ...cat, fieldType: newType } : cat))
    );
  };

  const handleAddMetric = (catId) => {
    const promptName = window.prompt('Enter new metric name:');
    if (!promptName || !promptName.trim()) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        const isNumeric = cat.fieldType === 'Numeric';
        const newMetric = {
          id: `custom-${Date.now()}`,
          name: promptName.trim(),
          inChart: false,
          value: isNumeric ? '80' : 'High',
          type: isNumeric ? 'numeric' : 'qualitative',
        };
        return {
          ...cat,
          metrics: [...cat.metrics, newMetric],
        };
      })
    );
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
          const Icon = cat.icon;
          return (
            <article key={cat.id} className="category-metric-card">
              {/* Category Top Banner */}
              <div className="category-card-top">
                <div className="category-title-row">
                  <Icon size={16} strokeWidth={2.2} className="cat-icon" />
                  <h3 className="category-name">{cat.title}</h3>
                </div>
                <span className="category-avg-badge">{cat.avg}</span>
              </div>

              {/* Rows List */}
              <div className="metric-rows-list">
                {cat.metrics.map((metric) => (
                  <div key={metric.id} className="submetric-row">
                    {/* Remove Action */}
                    <button
                      type="button"
                      className="btn-remove-metric"
                      onClick={() => handleRemoveMetric(cat.id, metric.id)}
                      aria-label={`Remove ${metric.name}`}
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
                      aria-label={`Toggle ${metric.name} chart display`}
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
                          className={`metric-qual-badge badge-${metric.value.toLowerCase()}`}
                        >
                          {metric.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer: Field Type selector & Add Button */}
              <div className="category-card-footer">
                <div className="field-type-selector-row">
                  <span className="field-type-label">NEW FIELD TYPE:</span>
                  <div className="field-type-pills">
                    <button
                      type="button"
                      className={`type-pill ${
                        cat.fieldType === 'Numeric' ? 'active' : ''
                      }`}
                      onClick={() => handleChangeFieldType(cat.id, 'Numeric')}
                    >
                      Numeric
                    </button>
                    <button
                      type="button"
                      className={`type-pill ${
                        cat.fieldType === 'High/Med/Low' ? 'active' : ''
                      }`}
                      onClick={() => handleChangeFieldType(cat.id, 'High/Med/Low')}
                    >
                      High/Med/Low
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-add-custom-field"
                  onClick={() => handleAddMetric(cat.id)}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add custom field</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
