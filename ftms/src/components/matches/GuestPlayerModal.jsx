import { useState } from 'react';
import { X, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function GuestPlayerModal({ isOpen, onClose, onSave, teams = [] }) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: '#guest-name-input' });
  const [name, setName] = useState('');
  const [position, setPosition] = useState('FWD');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [targetTeamIdx, setTargetTeamIdx] = useState(-1);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Guest player name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Guest player name cannot exceed 100 characters.');
      return;
    }

    onSave({
      name: trimmedName,
      position,
      jerseyNumber: jerseyNumber.trim() || 'G',
      notes: notes.trim(),
      targetTeamIdx: Number(targetTeamIdx),
    });

    // Reset form
    setName('');
    setPosition('FWD');
    setJerseyNumber('');
    setNotes('');
    setTargetTeamIdx(-1);
    onClose();
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '480px' }}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <UserPlus size={18} className="modal-header-icon" />
            <h2 id="guest-modal-title" className="modal-heading">
              Add Guest Player
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
          Add an external guest, sub, or trialist to participate in this matchday roster without registering a permanent player dossier.
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
          <div className="rating-input-field">
            <label className="rating-field-label" htmlFor="guest-name-input">
              Guest Player Full Name * (max 100 chars)
            </label>
            <input
              id="guest-name-input"
              autoFocus
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Liam Smith (Guest)"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">Preferred Position *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
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
              <label className="rating-field-label">Jersey # or Tag</label>
              <input
                type="text"
                placeholder="e.g. 99 or G1"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                maxLength={5}
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

          <div className="rating-input-field" style={{ marginTop: '12px' }}>
            <label className="rating-field-label">Assign to Team</label>
            <select
              value={targetTeamIdx}
              onChange={(e) => setTargetTeamIdx(Number(e.target.value))}
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
              <option value={-1}>Unassigned Pool / Bench</option>
              {teams.map((t, idx) => (
                <option key={idx} value={idx}>
                  {t.name || `Team ${String.fromCharCode(65 + idx)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="rating-input-field" style={{ marginTop: '12px' }}>
            <label className="rating-field-label">Scouting / Guest Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Trialist friend of Alex"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

          <div className="modal-actions-footer" style={{ marginTop: '20px' }}>
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
              <span>Add Guest Player</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
