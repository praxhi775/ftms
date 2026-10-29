import { useState, useEffect } from 'react';
import { X, CheckCircle, Trophy, Users, Search, AlertCircle } from 'lucide-react';
import { playerService } from '../../services/playerService';
import { matchService } from '../../services/matchService';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function MatchFormModal({ isOpen, onClose, onMatchSaved, matchToEdit }) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: '#match-title-input' });
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:30',
    venue: 'North Training Pitch',
    matchType: 'Friendly',
    notes: '',
  });

  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSquad() {
      try {
        const squad = await playerService.getAll();
        setAvailablePlayers(squad);
      } catch (err) {
        console.error('Failed to load squad for session:', err);
      }
    }
    if (isOpen) {
      loadSquad();
    }
  }, [isOpen]);

  useEffect(() => {
    if (matchToEdit) {
      setFormData({
        title: matchToEdit.title || '',
        date: matchToEdit.date || new Date().toISOString().split('T')[0],
        time: matchToEdit.time || '09:30',
        venue: matchToEdit.venue || 'North Training Pitch',
        matchType: matchToEdit.matchType || 'Friendly',
        notes: matchToEdit.notes || '',
      });
      setSelectedPlayerIds(matchToEdit.selectedPlayerIds || []);
    } else {
      setFormData({
        title: 'Sunday Scrimmage',
        date: new Date().toISOString().split('T')[0],
        time: '09:30',
        venue: 'North Training Pitch',
        matchType: 'Friendly',
        notes: '',
      });
      // Start with active players selected by default or empty selection
      setSelectedPlayerIds([]);
    }
    setError(null);
  }, [matchToEdit, isOpen]);

  if (!isOpen) return null;

  const filteredPlayers = availablePlayers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      String(p.jerseyNumber).includes(playerSearch);
    const matchesPos = positionFilter ? p.position === positionFilter : true;
    return matchesSearch && matchesPos;
  });

  const togglePlayer = (id) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredPlayers.map((p) => p.id);
    const merged = Array.from(new Set([...selectedPlayerIds, ...allFilteredIds]));
    setSelectedPlayerIds(merged);
  };

  const handleClearSelection = () => {
    const currentFilteredIds = new Set(filteredPlayers.map((p) => p.id));
    setSelectedPlayerIds((prev) => prev.filter((id) => !currentFilteredIds.has(id)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Session title or fixture name is required.');
      }
      if (!formData.date) {
        throw new Error('Session date is required.');
      }
      if (selectedPlayerIds.length === 0) {
        throw new Error('Please select at least one available player for the matchday squad.');
      }

      const payload = {
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        venue: formData.venue.trim(),
        matchType: formData.matchType,
        selectedPlayerIds,
        notes: formData.notes.trim(),
      };

      if (matchToEdit) {
        await matchService.update(matchToEdit.id, payload);
      } else {
        await matchService.add(payload);
      }

      onMatchSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save session');
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
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-group">
            <Trophy size={18} className="modal-header-icon" />
            <h2 className="modal-heading">
              {matchToEdit ? 'Edit Session' : 'Schedule New Session'}
            </h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close session dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Set up session details and hand-pick the available squad roster for team generation.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '14px' }}>
          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">Session Title *</label>
              <input
                id="match-title-input"
                autoFocus
                type="text"
                required
                placeholder="e.g. Sunday Scrimmage #15"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="rating-input-field">
              <label className="rating-field-label">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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

            <div className="rating-input-field">
              <label className="rating-field-label">Kickoff Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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

            <div className="rating-input-field">
              <label className="rating-field-label">Type</label>
              <select
                value={formData.matchType}
                onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
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
                <option value="Friendly">Friendly Scrimmage</option>
                <option value="League">League Fixture</option>
                <option value="Cup">Cup</option>
                <option value="Training">Tactical Drills</option>
              </select>
            </div>
          </div>

          <div className="rating-input-field">
            <label className="rating-field-label">Venue / Pitch</label>
            <input
              type="text"
              placeholder="e.g. North Training Pitch"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
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

          {/* Available Player Picker */}
          <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: 'var(--forest-green)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Matchday Squad ({selectedPlayerIds.length} Selected)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{ fontSize: '11.5px', color: 'var(--forest-green)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Select All
                </button>
                <span style={{ color: 'var(--border-strong)' }}>|</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Filter and Search within Picker */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter available players..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 28px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">All Positions</option>
                <option value="GK">GK</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="FWD">FWD</option>
              </select>
            </div>

            {/* Scrollable Player List */}
            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-subtle)',
              padding: '4px',
            }}>
              {filteredPlayers.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  No squad members found.
                </div>
              ) : (
                filteredPlayers.map((player) => {
                  const isChecked = selectedPlayerIds.includes(player.id);
                  return (
                    <label
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: isChecked ? '#E8F5E9' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePlayer(player.id)}
                          style={{ accentColor: 'var(--forest-green)', cursor: 'pointer' }}
                        />
                        <span style={{
                          fontWeight: 700,
                          fontSize: '11px',
                          backgroundColor: 'var(--bg-card)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          #{player.jerseyNumber}
                        </span>
                        <span style={{ fontWeight: isChecked ? 600 : 400, color: 'var(--text-primary)' }}>
                          {player.name}
                        </span>
                      </div>
                      <span className={`position-badge badge-${player.position.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {player.position}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Match Notes */}
          <div className="rating-input-field" style={{ marginTop: '4px' }}>
            <label className="rating-field-label">Tactical Notes / Directives</label>
            <textarea
              rows="2"
              placeholder="e.g. Scrimmage rules, bib colors, pre-session focus..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div className="modal-actions-footer" style={{ marginTop: '12px' }}>
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
              <span>{isSubmitting ? 'Saving...' : matchToEdit ? 'Save Session' : 'Schedule Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}