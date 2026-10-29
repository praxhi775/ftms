import { useState, useEffect } from 'react';
import { X, CheckCircle, Sliders, AlertCircle } from 'lucide-react';
import { statsService } from '../../services/statsService';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

const STAT_CATEGORIES = [
  'Physical',
  'Tactical',
  'Technical',
];

export default function StatDefinitionModal({ isOpen, onClose, onSaved, defToEdit }) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: '#stat-name-input' });

  const [formData, setFormData] = useState({
    name: '',
    category: 'Technical',
    description: '',
    type: 'quantitative', // 'quantitative' | 'qualitative'
    unit: '',
    inChart: true,
    choicesStr: 'High, Medium, Low',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defToEdit) {
      setFormData({
        name: defToEdit.name || '',
        category: defToEdit.category || 'Technical',
        description: defToEdit.description || '',
        type: defToEdit.type || 'quantitative',
        unit: defToEdit.unit || '',
        inChart: defToEdit.inChart === 1 || defToEdit.inChart === true,
        choicesStr: defToEdit.choices ? defToEdit.choices.join(', ') : 'High, Medium, Low',
      });
    } else {
      setFormData({
        name: '',
        category: 'Technical',
        description: '',
        type: 'quantitative',
        unit: '',
        inChart: true,
        choicesStr: 'High, Medium, Low',
      });
    }
    setError(null);
  }, [defToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Statistic name is required.');
      }
      if (!formData.category) {
        throw new Error('Main category is required.');
      }

      const choices = formData.type === 'qualitative'
        ? formData.choicesStr.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        type: formData.type,
        unit: formData.type === 'quantitative' ? formData.unit.trim() : '',
        inChart: formData.inChart,
        choices,
      };

      if (defToEdit) {
        await statsService.updateDefinition(defToEdit.id, payload);
      } else {
        await statsService.addDefinition(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save statistic definition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stat-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '480px' }}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <Sliders size={18} className="modal-header-icon" />
            <h2 id="stat-modal-title" className="modal-heading">
              {defToEdit ? 'Edit Custom Statistic' : 'Create Custom Statistic'}
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
          Define custom metrics with designated main categories to track player performance across sessions.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#B91C1C',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Statistic Name */}
          <div className="rating-input-field">
            <label htmlFor="stat-name-input" className="rating-field-label">Statistic Name *</label>
            <input
              id="stat-name-input"
              autoFocus
              type="text"
              required
              placeholder="e.g. Tackles Won, Teamwork, Interceptions, Key Passes..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontFamily: 'inherit',
                fontSize: '13.5px',
              }}
            />
          </div>

          {/* Main Category */}
          <div className="rating-input-field">
            <label htmlFor="stat-category-input" className="rating-field-label">Main Category *</label>
            <select
              id="stat-category-input"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                backgroundColor: '#fff',
              }}
            >
              {STAT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Specifies the primary tactical category for grouping and analysis
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="rating-input-field">
              <label htmlFor="stat-type-input" className="rating-field-label">Data Type</label>
              <select
                id="stat-type-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '13.5px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="quantitative">Quantitative (Numeric)</option>
                <option value="qualitative">Qualitative (Categorical)</option>
              </select>
            </div>

            <div className="rating-input-field">
              <label htmlFor="stat-unit-input" className="rating-field-label">Unit (Optional)</label>
              <input
                id="stat-unit-input"
                type="text"
                placeholder="e.g. %, km, goals"
                disabled={formData.type === 'qualitative'}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '13.5px',
                  backgroundColor: formData.type === 'qualitative' ? '#F3F4F6' : '#fff',
                }}
              />
            </div>
          </div>

          {formData.type === 'qualitative' && (
            <div className="rating-input-field">
              <label htmlFor="stat-choices-input" className="rating-field-label">Choices (comma-separated)</label>
              <input
                id="stat-choices-input"
                type="text"
                placeholder="Poor, Average, Good, Excellent"
                value={formData.choicesStr}
                onChange={(e) => setFormData({ ...formData, choicesStr: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '13.5px',
                }}
              />
            </div>
          )}

          <div className="rating-input-field">
            <label htmlFor="stat-desc-input" className="rating-field-label">Description (Optional)</label>
            <input
              id="stat-desc-input"
              type="text"
              placeholder="Brief summary of what this stat measures..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontFamily: 'inherit',
                fontSize: '13.5px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
            <input
              type="checkbox"
              id="inChartCheckbox"
              checked={formData.inChart}
              onChange={(e) => setFormData({ ...formData, inChart: e.target.checked })}
              style={{ accentColor: 'var(--forest-green)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="inChartCheckbox" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Include in Analytics Charts
            </label>
          </div>

          <div className="modal-actions-footer" style={{ marginTop: '12px' }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>{isSubmitting ? 'Saving...' : defToEdit ? 'Save Changes' : 'Create Statistic'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}