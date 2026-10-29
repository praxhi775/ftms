import { useState, useEffect } from 'react';
import { X, CheckCircle, CalendarClock } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function SessionFormModal({
  isOpen,
  onClose,
  teams = [],
  sessionToEdit = null,
  nextNumber = 1,
  hasEvents = false,
  onSave,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: 'input' });

  const [name, setName] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (sessionToEdit) {
      setName(sessionToEdit.name);
      setTeamAId(sessionToEdit.teamAId);
      setTeamBId(sessionToEdit.teamBId);
    } else {
      setName(`Match ${nextNumber}`);
      setTeamAId(teams[0]?.id || '');
      setTeamBId(teams[1]?.id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!teamAId || !teamBId) {
      setError('Please choose both teams.');
      return;
    }
    if (teamAId === teamBId) {
      setError('A match needs two different teams.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onSave({ name, teamAId, teamBId });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-strong, #D1D5DB)',
    backgroundColor: '#fff',
    fontSize: '13.5px',
    fontFamily: 'inherit',
  };

  const teamOptions = teams.map((t) => (
    <option key={t.id} value={t.id}>{t.name}</option>
  ));

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-session-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '460px' }}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <CalendarClock size={18} className="modal-header-icon" />
            <h2 id="modal-session-title" className="modal-heading">
              {sessionToEdit ? 'Edit Match' : 'Add Match'}
            </h2>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close match dialog">
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          A session is one fixture between two of this match&apos;s teams.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '12.5px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div className="rating-input-field">
            <label htmlFor="session-name" className="rating-field-label">Match name</label>
            <input
              id="session-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Round 1"
              style={fieldStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="rating-input-field">
              <label htmlFor="session-team-a" className="rating-field-label">Team A</label>
              <select
                id="session-team-a"
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                disabled={hasEvents}
                style={{ ...fieldStyle, cursor: hasEvents ? 'not-allowed' : 'pointer' }}
              >
                {teamOptions}
              </select>
            </div>
            <div className="rating-input-field">
              <label htmlFor="session-team-b" className="rating-field-label">Team B</label>
              <select
                id="session-team-b"
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                disabled={hasEvents}
                style={{ ...fieldStyle, cursor: hasEvents ? 'not-allowed' : 'pointer' }}
              >
                {teamOptions}
              </select>
            </div>
          </div>

          {hasEvents && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-6px' }}>
              Teams are locked because activity has already been recorded for this match.
            </p>
          )}

          <div className="modal-actions-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>{sessionToEdit ? 'Save Match' : 'Add Match'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}