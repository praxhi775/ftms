import { useState, useMemo } from 'react';
import { X, CheckCircle, Activity } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { ACTIVITY_TYPES } from './activityTypes';
import SearchablePlayerSelect from './SearchablePlayerSelect';

export default function RecordActivityModal({
  isOpen,
  onClose,
  match,
  players = [],
  teams = [],
  sessions = [],
  defaultSessionId = null,
  onSave,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: 'input[role="combobox"]' });

  const [type, setType] = useState('goal');
  const [sessionId, setSessionId] = useState(defaultSessionId || '');
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSessions = sessions.length > 0;
  const selectedSession = sessions.find((x) => x.id === sessionId) || null;

  // Group players by team so the right person is easy to find.
  // With sessions, only the two teams playing in the chosen session are listed.
  const groups = useMemo(() => {
    const byId = {};
    players.forEach((p) => { byId[p.id] = p; });
    const result = [];

    if (hasSessions) {
      if (!selectedSession) return [];
      [selectedSession.teamAId, selectedSession.teamBId].forEach((tid) => {
        const team = teams.find((t) => t.id === tid);
        if (!team) return;
        const members = (team.playerIds || []).map((pid) => byId[pid]).filter(Boolean);
        if (members.length > 0) result.push({ label: team.name, teamId: team.id, members });
      });
      return result;
    }

    const used = new Set();
    teams.forEach((team, idx) => {
      const members = (team.playerIds || []).map((pid) => byId[pid]).filter(Boolean);
      members.forEach((m) => used.add(m.id));
      if (members.length > 0) {
        result.push({ label: team.name || `Team ${String.fromCharCode(65 + idx)}`, teamId: team.id || null, members });
      }
    });

    const rest = players.filter((p) => !used.has(p.id));
    if (rest.length > 0) {
      result.push({ label: teams.length > 0 ? 'Unassigned' : 'Match Squad', teamId: null, members: rest });
    }
    return result;
  }, [players, teams, hasSessions, selectedSession]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (hasSessions && !selectedSession) {
      setError('Please select a session.');
      return;
    }
    if (!playerId) {
      setError('Please select a player.');
      return;
    }
    const min = minute === '' ? '' : Number(minute);
    if (min !== '' && (isNaN(min) || min < 0 || min > 150)) {
      setError('Minute must be between 0 and 150.');
      return;
    }
    try {
      setIsSubmitting(true);
      const owner = groups.find((g) => g.members.some((m) => String(m.id) === String(playerId)));
      await onSave({
        type,
        playerId: isNaN(Number(playerId)) ? playerId : Number(playerId),
        minute: min,
        sessionId: hasSessions ? sessionId : null,
        teamId: owner?.teamId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record activity.');
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

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-activity-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '460px' }}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <Activity size={18} className="modal-header-icon" />
            <h2 id="modal-activity-title" className="modal-heading">Record Activity</h2>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close record activity dialog">
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Log who scored a goal or committed a foul in {match?.title || 'this match'}{hasSessions ? ', for a specific session' : ''}.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '12.5px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Session (only when the match has sessions) */}
          {hasSessions && (
            <div className="rating-input-field">
              <label htmlFor="activity-session" className="rating-field-label">Session</label>
              <select
                id="activity-session"
                value={sessionId}
                onChange={(e) => {
                  setSessionId(e.target.value);
                  setPlayerId('');
                }}
                style={{ ...fieldStyle, cursor: 'pointer' }}
              >
                <option value="">Select session…</option>
                {sessions.map((x) => {
                  const a = teams.find((t) => t.id === x.teamAId)?.name || 'Removed team';
                  const b = teams.find((t) => t.id === x.teamBId)?.name || 'Removed team';
                  return (
                    <option key={x.id} value={x.id}>
                      {x.name}: {a} vs {b} ({x.status})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Activity Type */}
          <div className="rating-input-field">
            <span className="rating-field-label">Activity</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(ACTIVITY_TYPES).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const selected = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    aria-pressed={selected}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border-strong, #D1D5DB)',
                      backgroundColor: selected ? cfg.bg : '#fff',
                      color: selected ? cfg.color : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} strokeWidth={2.4} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player */}
          <div className="rating-input-field">
            <label htmlFor="activity-player" className="rating-field-label">Player</label>
            <SearchablePlayerSelect
              groups={groups}
              value={playerId}
              onChange={setPlayerId}
              placeholder={hasSessions && !selectedSession ? 'Select a session first' : 'Search by name or jersey #…'}
            />
          </div>

          {/* Minute */}
          <div className="rating-input-field">
            <label htmlFor="activity-minute" className="rating-field-label">Minute (optional)</label>
            <input
              id="activity-minute"
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 34"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>Record {ACTIVITY_TYPES[type].label}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}