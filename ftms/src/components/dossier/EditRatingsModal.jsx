import { useState } from 'react';
import { X, CheckCircle, SlidersHorizontal } from 'lucide-react';

const ATTRIBUTE_FIELDS = [
  { key: 'pac', label: 'Pace (PAC)', desc: 'Acceleration & Sprint Speed' },
  { key: 'sho', label: 'Shooting (SHO)', desc: 'Finishing & Shot Power' },
  { key: 'pas', label: 'Passing (PAS)', desc: 'Vision & Short Passing' },
  { key: 'dri', label: 'Dribbling (DRI)', desc: 'Agility, Balance & Ball Control' },
  { key: 'def', label: 'Defending (DEF)', desc: 'Interceptions & Tackling' },
  { key: 'phy', label: 'Physical (PHY)', desc: 'Stamina, Strength & Jumping' },
];

export default function EditRatingsModal({
  initialRatings,
  onClose,
  onUpdateRatings,
}) {
  const [formValues, setFormValues] = useState(() => ({ ...initialRatings }));

  const handleChange = (key, rawVal) => {
    let num = parseInt(rawVal, 10);
    if (isNaN(num)) num = '';
    else num = Math.max(1, Math.min(99, num));

    setFormValues((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate each key has a value between 1 and 99
    const cleanRatings = {};
    ATTRIBUTE_FIELDS.forEach(({ key }) => {
      const val = parseInt(formValues[key], 10);
      cleanRatings[key] = isNaN(val) ? 50 : Math.max(1, Math.min(99, val));
    });

    onUpdateRatings(cleanRatings);
    onClose();
  };

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
      <div className="modal-content-card">
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-group">
            <SlidersHorizontal size={18} className="modal-header-icon" />
            <h2 id="modal-ratings-title" className="modal-heading">
              Edit Primary Ratings
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
          Adjust Marcus Vance's six core attributes (1–99). The radar chart geometry, overall rating (OVR), and categorical baselines will recalibrate dynamically.
        </p>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="modal-ratings-form">
          <div className="modal-inputs-grid">
            {ATTRIBUTE_FIELDS.map(({ key, label, desc }) => (
              <div key={key} className="rating-input-field">
                <div className="input-label-row">
                  <label htmlFor={`input-${key}`} className="rating-field-label">
                    {label}
                  </label>
                  <span className="rating-desc-hint">{desc}</span>
                </div>
                <div className="input-stepper-wrap">
                  <input
                    id={`input-${key}`}
                    type="number"
                    min="1"
                    max="99"
                    value={formValues[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="rating-number-input"
                    required
                  />
                  <span className="rating-scale-tag">/ 99</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions Row */}
          <div className="modal-actions-footer">
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
