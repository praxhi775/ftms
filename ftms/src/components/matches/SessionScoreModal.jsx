import { useState, useEffect } from 'react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function SessionScoreModal({ isOpen, onClose, session, teamAName, teamBName, initialScore, hasRecordedGoals, onConfirm }) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: 'input' });
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHome(initialScore?.a ?? 0);
      setAway(initialScore?.b ?? 0);
      setError('');
    }
  }, [isOpen, initialScore]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onConfirm({ home: Number(home), away: Number(away) });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete match.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid var(--border-strong)',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 700,
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-session-score-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '400px' }}>
        <h2 id="modal-session-score-title" className="modal-heading" style={{ marginBottom: '8px' }}>
          Complete “{session.name}”
        </h2>
        <p className="modal-description">
          {hasRecordedGoals
            ? 'Score is pre-filled from the goals recorded in this match. You can adjust it before confirming.'
            : 'Enter the final score of this match.'}
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '12.5px', fontWeight: 600, marginTop: '10px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">{teamAName}</label>
              <input type="number" min="0" required value={home} onChange={(e) => setHome(e.target.value)} style={inputStyle} />
            </div>
            <div className="rating-input-field">
              <label className="rating-field-label">{teamBName}</label>
              <input type="number" min="0" required value={away} onChange={(e) => setAway(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit">
              Confirm &amp; Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}