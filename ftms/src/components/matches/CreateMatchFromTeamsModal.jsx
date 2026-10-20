import { useState, useEffect } from 'react';
import { X, Trophy, CheckCircle } from 'lucide-react';
import { matchService } from '../../services/matchService';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function CreateMatchFromTeamsModal({
  isOpen,
  onClose,
  teams,
  guestPlayers,
  onSuccess,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: '#match-title-input' });

  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  
  const defaultTitle = teams.length >= 2 
    ? `${teams[0]?.name || 'Team A'} vs ${teams[1]?.name || 'Team B'}`
    : 'Sunday Scrimmage';

  const [formData, setFormData] = useState({
    title: defaultTitle,
    opponent: 'Internal Squad Match',
    date: new Date().toISOString().split('T')[0],
    time: '09:30',
    venue: 'North Training Pitch',
    matchType: 'Friendly',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load upcoming matches in case user wants to attach to an existing one
    async function fetchUpcoming() {
      try {
        const list = await matchService.getUpcoming();
        setUpcomingMatches(list);
        if (list.length > 0) {
          setSelectedMatchId(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to load upcoming matches:', err);
      }
    }
    fetchUpcoming();

    const title = teams.length >= 2
      ? `${teams[0]?.name || 'Team A'} vs ${teams[1]?.name || 'Team B'}`
      : 'Sunday Scrimmage';

    setFormData({
      title,
      opponent: 'Internal Squad Match',
      date: new Date().toISOString().split('T')[0],
      time: '09:30',
      venue: 'North Training Pitch',
      matchType: 'Friendly',
      notes: '',
    });
    setError(null);
  }, [isOpen, teams]);

  if (!isOpen) return null;

  const totalAssignedCount = teams.reduce((acc, t) => acc + (t.playerIds?.length || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'new') {
        if (!formData.title.trim()) {
          throw new Error('Match title is required.');
        }
        if (!formData.date) {
          throw new Error('Match date is required.');
        }

        // Get squad player IDs assigned to any team
        const guestIdSet = new Set(guestPlayers.map((g) => g.id));
        const allAssignedPlayerIds = Array.from(
          new Set(teams.flatMap((t) => t.playerIds || []).filter((id) => !guestIdSet.has(id)))
        );

        const newMatchId = await matchService.add({
          title: formData.title.trim(),
          opponent: formData.opponent.trim(),
          date: formData.date,
          time: formData.time,
          venue: formData.venue.trim(),
          matchType: formData.matchType,
          selectedPlayerIds: allAssignedPlayerIds,
          teams,
          guestPlayers,
          notes: formData.notes.trim(),
        });

        onSuccess(newMatchId, 'Match fixture created with handcrafted lineups!');
      } else {
        if (!selectedMatchId) {
          throw new Error('Please select an existing upcoming match.');
        }

        const matchIdNum = Number(selectedMatchId);
        // Also update selectedPlayerIds for that match
        const guestIdSet = new Set(guestPlayers.map((g) => g.id));
        const allAssignedPlayerIds = Array.from(
          new Set(teams.flatMap((t) => t.playerIds || []).filter((id) => !guestIdSet.has(id)))
        );

        await matchService.update(matchIdNum, {
          teams,
          guestPlayers,
          selectedPlayerIds: allAssignedPlayerIds,
        });

        onSuccess(matchIdNum, 'Teams and lineups assigned to upcoming match!');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-match-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header-row">
          <div className="modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'var(--pale-green-bg)',
              color: 'var(--forest-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={16} />
            </div>
            <div>
              <h2 id="create-match-modal-title" className="modal-heading" style={{ margin: 0, fontSize: '18px' }}>
                Save Teams &amp; Create Match
              </h2>
              <p className="modal-description" style={{ margin: 0, fontSize: '12px' }}>
                Lock your tactical lineups into a scheduled match fixture.
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginTop: '16px',
          backgroundColor: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setMode('new')}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: mode === 'new' ? '#fff' : 'transparent',
              color: mode === 'new' ? 'var(--forest-green)' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: mode === 'new' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            Create New Fixture
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            disabled={upcomingMatches.length === 0}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: mode === 'existing' ? '#fff' : 'transparent',
              color: mode === 'existing' ? 'var(--forest-green)' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: mode === 'existing' ? 'var(--shadow-sm)' : 'none',
              cursor: upcomingMatches.length === 0 ? 'not-allowed' : 'pointer',
              opacity: upcomingMatches.length === 0 ? 0.5 : 1
            }}
          >
            Apply to Existing Match {upcomingMatches.length > 0 ? `(${upcomingMatches.length})` : ''}
          </button>
        </div>

        {/* Lineups Summary Pill */}
        <div style={{
          margin: '14px 0',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: '#F9FAFB',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Lineup Summary ({teams.length} Teams, {totalAssignedCount} Players)
            </span>
            {guestPlayers.length > 0 && (
              <span className="badge badge-peach" style={{ fontSize: '10px' }}>
                {guestPlayers.length} Guest{guestPlayers.length > 1 ? 's' : ''} Included
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {teams.map((t, idx) => (
              <div key={idx} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#fff',
                border: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                fontWeight: 600
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: t.color || '#003B1B'
                }} />
                <span>{t.name}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({t.playerIds?.length || 0})
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontSize: '12.5px',
              border: '1px solid #FCA5A5'
            }}>
              {error}
            </div>
          )}

          {mode === 'new' ? (
            <>
              {/* Match Title */}
              <div className="rating-input-field">
                <label htmlFor="match-title-input" className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Fixture Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  id="match-title-input"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="rating-input-field">
                  <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    Date <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-strong)',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div className="rating-input-field">
                  <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    Kickoff Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-strong)',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Venue & Match Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="rating-input-field">
                  <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    Venue / Pitch
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. North Training Pitch"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-strong)',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div className="rating-input-field">
                  <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    Match Type
                  </label>
                  <select
                    value={formData.matchType}
                    onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-strong)',
                      fontSize: '13.5px',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Friendly">Friendly Scrimmage</option>
                    <option value="League">League Fixture</option>
                    <option value="Cup">Cup Match</option>
                    <option value="Training">Training Session</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="rating-input-field">
                <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Notes / Objectives (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Focus on counter-attacks and high pressing."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </>
          ) : (
            /* Existing Match Dropdown */
            <div className="rating-input-field">
              <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                Select Upcoming Match
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box'
                }}
              >
                {upcomingMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} — {m.date} ({m.venue || 'TBD'})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                The teams and lineups you built will override any previous lineups for this match.
              </span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions-footer" style={{ marginTop: '8px' }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={15} />
              <span>{isSubmitting ? 'Saving...' : mode === 'new' ? 'Create Match & View' : 'Apply & View Match'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
