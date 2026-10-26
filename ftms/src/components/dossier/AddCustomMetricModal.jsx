import { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, PlusCircle, AlertCircle } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { clampMetric, METRIC_MIN, METRIC_MAX } from '../../utils/subMetricUtils';

export default function AddCustomMetricModal({
  isOpen,
  initialCategoryId = 'physical',
  categories = [],
  onClose,
  onAddMetric,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: '#custom-metric-name' });

  const [selectedCatId, setSelectedCatId] = useState(initialCategoryId);
  const [metricName, setMetricName] = useState('');
  const [initialValue, setInitialValue] = useState('80');
  const [inChart, setInChart] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCatId(initialCategoryId);
      setMetricName('');
      setInitialValue('80');
      setInChart(true);
      setError('');
    }
  }, [isOpen, initialCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!metricName.trim()) {
      setError('Please provide a name for this custom metric.');
      return;
    }

    if (!selectedCatId) {
      setError('Please select a main category.');
      return;
    }

    onAddMetric({
      categoryId: selectedCatId,
      name: metricName.trim(),
      type: 'numeric',
      value: String(clampMetric(initialValue, 80)),
      inChart,
    });

    onClose();
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-metric-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-content-card"
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header-row">
          <div className="modal-title-group">
            <PlusCircle size={18} className="modal-header-icon" />
            <h2 id="modal-add-metric-title" className="modal-heading">
              Add Custom Sub-Metric
            </h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Create a custom tactical or performance dimension to calibrate across player match evaluations.
        </p>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '13px',
              marginBottom: '14px',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Main Category */}
          <div className="rating-input-field">
            <label htmlFor="custom-metric-category" className="rating-field-label">
              Main Category *
            </label>
            <select
              id="custom-metric-category"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong, #D1D5DB)',
                backgroundColor: '#fff',
                fontSize: '13.5px',
                fontFamily: 'inherit',
              }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Select which category this metric belongs to
            </span>
          </div>

          {/* Metric Name */}
          <div className="rating-input-field">
            <label htmlFor="custom-metric-name" className="rating-field-label">
              Metric Name *
            </label>
            <input
              id="custom-metric-name"
              autoFocus
              type="text"
              placeholder="e.g. Long Shots, Agility, Heading, Composure..."
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong, #D1D5DB)',
                fontSize: '13.5px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Initial Value (all sub-metrics are numeric 1-100) */}
          <div className="rating-input-field">
            <label htmlFor="custom-metric-initial-val" className="rating-field-label">
              Initial Value ({METRIC_MIN}–{METRIC_MAX})
            </label>
            <input
              id="custom-metric-initial-val"
              type="number"
              min={METRIC_MIN}
              max={METRIC_MAX}
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong, #D1D5DB)',
                fontSize: '13.5px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Include in Polygon Chart */}
          {(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="custom-metric-inchart"
                checked={inChart}
                onChange={(e) => setInChart(e.target.checked)}
                style={{
                  accentColor: 'var(--forest-green)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="custom-metric-inchart"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Plot on Attribute Profile Polygon Chart
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="modal-actions-footer" style={{ marginTop: '10px' }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit">
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>Create Metric</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}