import { useState, useMemo } from 'react';
import { X, CheckCircle, SlidersHorizontal, Activity, Compass, Zap, HelpCircle } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { normalizeSubMetrics, clampMetric, METRIC_MIN, METRIC_MAX } from '../../utils/subMetricUtils';

const CATEGORY_ICONS = {
  physical: Activity,
  tactical: Compass,
  technical: Zap,
};

export default function EditRatingsModal({
  categories = [],
  playerName = 'Marcus Vance',
  onClose,
  onSave,
}) {
  const modalRef = useModalFocusTrap({ isOpen: true, onClose, initialFocusSelector: 'input[type="number"]' });

  // Clone categories state for editing
  const [formData, setFormData] = useState(() => {
    return normalizeSubMetrics(categories).map((cat) => ({
      ...cat,
      metrics: cat.metrics.map((m) => ({ ...m })),
    }));
  });

  const [activeTab, setActiveTab] = useState(categories[0]?.id || 'physical');

  const handleNumericChange = (catId, metricId, rawVal) => {
    let num = parseInt(rawVal, 10);
    if (isNaN(num)) num = '';
    else num = clampMetric(num);

    setFormData((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          metrics: cat.metrics.map((m) =>
            m.id === metricId ? { ...m, value: num } : m
          ),
        };
      })
    );
  };

  const handleStepNumeric = (catId, metricId, delta) => {
    setFormData((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          metrics: cat.metrics.map((m) => {
            if (m.id !== metricId) return m;
            const current = parseInt(m.value, 10) || 50;
            const next = clampMetric(current + delta);
            return { ...m, value: next };
          }),
        };
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clamp every value to 1-100 and recalculate category averages
    const updatedCategories = normalizeSubMetrics(formData);

    onSave(updatedCategories);
    onClose();
  };

  const currentCategory = useMemo(() => {
    return formData.find((c) => c.id === activeTab) || formData[0];
  }, [formData, activeTab]);

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ratings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-content-card"
        style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-group">
            <SlidersHorizontal size={18} className="modal-header-icon" />
            <h2 id="modal-ratings-title" className="modal-heading">
              Edit Sub-Metric Ratings
            </h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close edit ratings dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle / Explanatory Paragraph */}
        <p className="modal-description">
          Adjust {playerName}'s sub-metrics across categories. Numeric ratings will recalibrate category averages and polygon profile geometry dynamically.
        </p>

        {/* Category Tab Selector */}
        <div
          role="tablist"
          aria-label="Sub-metric categories"
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '10px',
            marginBottom: '16px',
          }}
        >
          {formData.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || HelpCircle;
            const isActive = cat.id === activeTab;
            return (
              <button
                key={cat.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`panel-${cat.id}`}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid var(--forest-green)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--sand-50, #FAF8F3)' : 'transparent',
                  color: isActive ? 'var(--forest-green)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} strokeWidth={2.2} />
                <span>{cat.title}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: isActive ? '#003B1B' : '#E5E7EB',
                    color: isActive ? '#fff' : '#4B5563',
                    fontWeight: 700,
                  }}
                >
                  {cat.avg}
                </span>
              </button>
            );
          })}
        </div>

        {/* Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="modal-ratings-form"
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}
        >
          {currentCategory && (
            <div
              id={`panel-${currentCategory.id}`}
              role="tabpanel"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}
            >
              {currentCategory.metrics.map((metric) => (
                <div
                  key={metric.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-subtle, #FAF8F3)',
                    border: '1px solid var(--border-subtle, #ECE7DD)',
                    borderRadius: '10px',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label
                        htmlFor={`input-metric-${metric.id}`}
                        style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {metric.name}
                      </label>
                      {metric.inChart && (
                        <span
                          className="badge badge-green"
                          style={{ fontSize: '9.5px', padding: '1px 5px', fontWeight: 700 }}
                        >
                          In Polygon
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Rating ({METRIC_MIN}–{METRIC_MAX})
                    </span>
                  </div>

                  {(
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleStepNumeric(currentCategory.id, metric.id, -1)}
                        aria-label={`Decrease ${metric.name}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        -
                      </button>
                      <input
                        id={`input-metric-${metric.id}`}
                        type="number"
                        min={METRIC_MIN}
                        max={METRIC_MAX}
                        value={metric.value}
                        onChange={(e) => handleNumericChange(currentCategory.id, metric.id, e.target.value)}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          padding: '5px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-strong, #D1D5DB)',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleStepNumeric(currentCategory.id, metric.id, 1)}
                        aria-label={`Increase ${metric.name}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions Row */}
          <div className="modal-actions-footer" style={{ marginTop: '20px', paddingTop: '12px' }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
            >
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>Update Dossier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}