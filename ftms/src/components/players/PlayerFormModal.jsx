import { useState, useEffect } from 'react';
import { X, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';
import { playerService } from '../../services/playerService';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function PlayerFormModal({ isOpen, onClose, onPlayerSaved, playerToEdit }) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: 'input[name="name"], input[placeholder*="Full Name"], #player-name-input' });
  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    age: '',
    position: 'MID',
    preferredFoot: 'Right',
    height: '',
    weight: '',
    notes: '',
    status: 'active',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (playerToEdit) {
      setFormData({
        name: playerToEdit.name || '',
        jerseyNumber: playerToEdit.jerseyNumber != null ? String(playerToEdit.jerseyNumber) : '',
        age: playerToEdit.age != null ? String(playerToEdit.age) : '',
        position: playerToEdit.position || 'MID',
        preferredFoot: playerToEdit.preferredFoot || 'Right',
        height: playerToEdit.height != null ? String(playerToEdit.height) : '',
        weight: playerToEdit.weight != null ? String(playerToEdit.weight) : '',
        notes: playerToEdit.notes || '',
        status: playerToEdit.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        jerseyNumber: '',
        age: '',
        position: 'MID',
        preferredFoot: 'Right',
        height: '',
        weight: '',
        notes: '',
        status: 'active',
      });
    }
    setError(null);
  }, [playerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Player full name is required.');
      }
      if (formData.name.trim().length > 100) {
        throw new Error('Player name cannot exceed 100 characters.');
      }
      if (formData.jerseyNumber === '' || isNaN(Number(formData.jerseyNumber))) {
        throw new Error('A valid jersey number is required.');
      }

      if (formData.height !== '' && formData.height !== null && formData.height !== undefined) {
        const h = Number(formData.height);
        if (isNaN(h) || h <= 100 || h >= 250) {
          throw new Error('Height must be greater than 100 cm and less than 250 cm (101–249 cm).');
        }
      }

      if (formData.weight !== '' && formData.weight !== null && formData.weight !== undefined) {
        const w = Number(formData.weight);
        if (isNaN(w) || w <= 20 || w >= 200) {
          throw new Error('Weight must be greater than 20 kg and less than 200 kg (21–199 kg).');
        }
      }

      const payload = {
        name: formData.name.trim(),
        jerseyNumber: Number(formData.jerseyNumber),
        age: formData.age ? Number(formData.age) : null,
        position: formData.position,
        preferredFoot: formData.preferredFoot,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        notes: formData.notes.trim(),
        status: formData.status,
      };

      if (playerToEdit) {
        await playerService.update(playerToEdit.id, payload);
      } else {
        await playerService.add(payload);
      }

      onPlayerSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save player');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '540px' }}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <UserPlus size={18} className="modal-header-icon" />
            <h2 className="modal-heading">
              {playerToEdit ? 'Edit Player' : 'Register New Player'}
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
          {playerToEdit
            ? 'Update squad member roster credentials and physical details.'
            : 'Add a new member to your team roster notebook. Jersey numbers must be unique among active players.'}
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

        <form onSubmit={handleSubmit} className="modal-ratings-form">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">Full Name * (max 100 chars)</label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Marcus Vance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="rating-input-field">
              <label className="rating-field-label">Jersey # *</label>
              <input
                type="number"
                min="0"
                max="99"
                required
                placeholder="10"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '12px' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">Position *</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="GK">Goalkeeper (GK)</option>
                <option value="DEF">Defender (DEF)</option>
                <option value="MID">Midfielder (MID)</option>
                <option value="FWD">Forward (FWD)</option>
              </select>
            </div>

            <div className="rating-input-field">
              <label className="rating-field-label">Preferred Foot</label>
              <select
                value={formData.preferredFoot}
                onChange={(e) => setFormData({ ...formData, preferredFoot: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both (Ambidextrous)</option>
              </select>
            </div>

            <div className="rating-input-field">
              <label className="rating-field-label">Age</label>
              <input
                type="number"
                min="10"
                max="65"
                placeholder="24"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '12px' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">Height (cm) (&gt;100 &amp; &lt;250)</label>
              <input
                type="number"
                min="101"
                max="249"
                placeholder="101–249 cm"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="rating-input-field">
              <label className="rating-field-label">Weight (kg) (&gt;20 &amp; &lt;200)</label>
              <input
                type="number"
                min="21"
                max="199"
                placeholder="21–199 kg"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="rating-input-field">
              <label className="rating-field-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="active">Active</option>
                <option value="injured">Injured</option>
                <option value="inactive">Inactive / Away</option>
              </select>
            </div>
          </div>

          <div className="rating-input-field" style={{ marginTop: '12px' }}>
            <label className="rating-field-label">Scouting Notes / Bio</label>
            <textarea
              rows="2"
              placeholder="Key strengths, tactical role, injury history..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="modal-actions-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
            >
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>{isSubmitting ? 'Saving...' : playerToEdit ? 'Save Changes' : 'Register Player'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
