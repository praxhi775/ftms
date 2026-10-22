import { useState } from 'react';
import { X, CheckCircle, Award } from 'lucide-react';
import { statsService } from '../../services/statsService';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function RecordStatsModal({
  isOpen,
  onClose,
  match,
  players,
  statDefinitions,
  existingStats = [],
  onStatsSaved,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: 'input[type="number"], select' });
  // Key format: `${playerId}_${statDefId}` -> value
  const [statValues, setStatValues] = useState(() => {
    const map = {};
    existingStats.forEach((s) => {
      map[`${s.playerId}_${s.statDefId}`] = s.value;
    });
    return map;
  });

  const [activePlayerId, setActivePlayerId] = useState(
    players[0]?.id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleValueChange = (playerId, statDefId, val) => {
    setStatValues((prev) => ({
      ...prev,
      [`${playerId}_${statDefId}`]: val,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const recordsToSave = [];
      players.forEach((player) => {
        statDefinitions.forEach((def) => {
          const key = `${player.id}_${def.id}`;
          const val = statValues[key];
          if (val !== undefined && val !== '') {
            recordsToSave.push({
              playerId: player.id,
              statDefId: def.id,
              value: val,
            });
          }
        });
      });

      await statsService.saveMatchStats(match.id, recordsToSave);
      onStatsSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save match player stats:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-group">
            <Award size={18} className="modal-header-icon" />
            <h2 className="modal-heading">Record Match Statistics</h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Log player performance ratings, goals, assists, and custom indicators for {match.title}.
        </p>

        {statDefinitions.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No custom statistic definitions found. Create stat fields on the Stats page first.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', overflow: 'hidden', flex: 1 }}>
            {/* Left Column: Player Selector */}
            <div style={{
              borderRight: '1px solid var(--border-subtle)',
              paddingRight: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Match Squad ({players.length})
              </span>
              {players.map((p) => {
                const isSelected = p.id === activePlayer?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePlayerId(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--pale-green-bg)' : 'transparent',
                      color: isSelected ? 'var(--forest-green)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '12.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <span>#{p.jerseyNumber} {p.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{p.position}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Stat Input Fields for Active Player */}
            <div style={{ overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activePlayer && (
                <>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{activePlayer.jerseyNumber} {activePlayer.name} ({activePlayer.position})
                    </h3>
                  </div>

                  {statDefinitions.map((def) => {
                    const key = `${activePlayer.id}_${def.id}`;
                    const currentVal = statValues[key] || '';

                    return (
                      <div key={def.id} className="rating-input-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="rating-field-label">
                            {def.name} {def.unit ? `(${def.unit})` : ''}
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {def.type === 'quantitative' ? 'Numeric' : 'Qualitative'}
                          </span>
                        </div>

                        {def.type === 'quantitative' ? (
                          <input
                            type="number"
                            placeholder="0"
                            value={currentVal}
                            onChange={(e) => handleValueChange(activePlayer.id, def.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-strong)',
                              fontFamily: 'inherit',
                              fontSize: '13.5px',
                            }}
                          />
                        ) : (
                          <select
                            value={currentVal}
                            onChange={(e) => handleValueChange(activePlayer.id, def.id, e.target.value)}
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
                            <option value="">-- Not Rated --</option>
                            {(def.choices || ['Poor', 'Average', 'Good', 'Excellent']).map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="modal-actions-footer" style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-submit"
            onClick={handleSave}
            disabled={isSubmitting || statDefinitions.length === 0}
          >
            <CheckCircle size={15} strokeWidth={2.4} />
            <span>{isSubmitting ? 'Saving Stats...' : 'Save All Stats'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
