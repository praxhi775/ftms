import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  Shuffle, 
  GripVertical, 
  X, 
  CheckCircle,
  Sparkles,
  RotateCcw,
  MoveRight
} from 'lucide-react';
import { playerService } from '../services/playerService';
import { generateTeams, swapPlayers } from '../services/teamService';
import GuestPlayerModal from '../components/matches/GuestPlayerModal';

const PRESET_TEAM_COLORS = [
  { name: 'Team Green', bg: '#003B1B' },
  { name: 'Team White', bg: '#4B5563' },
  { name: 'Team Blue', bg: '#1E40AF' },
  { name: 'Team Orange', bg: '#C2410C' },
  { name: 'Team Purple', bg: '#6B21A8' },
  { name: 'Team Gold', bg: '#854D0E' },
];

export default function TeamGenerator() {
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [guestPlayers, setGuestPlayers] = useState([]);
  const [teams, setTeams] = useState([
    { name: 'Team Green', playerIds: [] },
    { name: 'Team White', playerIds: [] },
  ]);
  const [numTeams, setNumTeams] = useState(2);
  const [loading, setLoading] = useState(true);

  // Drag and Drop
  const [draggingPlayer, setDraggingPlayer] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Modals & inputs
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    document.title = 'Team Builder | Team Manager';
    async function loadData() {
      try {
        setLoading(true);
        const players = await playerService.getActive();
        setSquadPlayers(players);
      } catch (err) {
        console.error('Failed to load active players:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allPlayerMap = {};
  squadPlayers.forEach((p) => { allPlayerMap[p.id] = p; });
  guestPlayers.forEach((g) => { allPlayerMap[g.id] = { ...g, isGuest: true }; });

  const assignedPlayerIds = new Set(teams.flatMap((t) => t.playerIds || []));
  const unassignedSquad = squadPlayers.filter((p) => !assignedPlayerIds.has(p.id));
  const unassignedGuests = guestPlayers.filter((g) => !assignedPlayerIds.has(g.id));
  const unassignedAll = [...unassignedSquad, ...unassignedGuests];

  // Drag and drop handlers
  const handleDragStart = (e, playerId, fromTeamIdx) => {
    setDraggingPlayer({ playerId, fromTeamIdx });
    e.dataTransfer.setData('text/plain', JSON.stringify({ playerId, fromTeamIdx }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingPlayer(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e, targetTeamIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetTeamIdx) setDragOverTarget(targetTeamIdx);
  };

  const handleDragLeave = (e, targetTeamIdx) => {
    if (dragOverTarget === targetTeamIdx) setDragOverTarget(null);
  };

  const handleDrop = (e, targetTeamIdx) => {
    e.preventDefault();
    setDragOverTarget(null);

    let dragData = draggingPlayer;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) dragData = JSON.parse(raw);
      } catch (err) {
        console.error(err);
      }
    }
    if (!dragData) return;
    const { playerId, fromTeamIdx } = dragData;
    if (fromTeamIdx === targetTeamIdx) return;

    let newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
    if (fromTeamIdx >= 0 && fromTeamIdx < newTeams.length) {
      newTeams[fromTeamIdx].playerIds = newTeams[fromTeamIdx].playerIds.filter((pid) => pid !== playerId);
    }
    if (targetTeamIdx >= 0 && targetTeamIdx < newTeams.length) {
      if (!newTeams[targetTeamIdx].playerIds.includes(playerId)) {
        newTeams[targetTeamIdx].playerIds.push(playerId);
      }
    }

    setTeams(newTeams);
    setDraggingPlayer(null);
    const pName = allPlayerMap[playerId]?.name || 'Player';
    const dest = targetTeamIdx >= 0 ? newTeams[targetTeamIdx].name : 'Unassigned Bench';
    showToast(`${pName} moved to ${dest}.`);
  };

  const handleCreateTeamSubmit = (e) => {
    e.preventDefault();
    const name = newTeamNameInput.trim() || `Team ${String.fromCharCode(65 + teams.length)}`;
    setTeams([...teams, { name, playerIds: [] }]);
    setNewTeamNameInput('');
    setIsNewTeamModalOpen(false);
    showToast(`"${name}" created.`);
  };

  const handleDeleteTeam = (teamIdx) => {
    const team = teams[teamIdx];
    setTeams(teams.filter((_, idx) => idx !== teamIdx));
    showToast(`"${team.name}" removed.`);
  };

  const handleClearTeams = () => {
    setTeams(teams.map((t) => ({ ...t, playerIds: [] })));
    showToast('All team assignments cleared.');
  };

  const handleAutoGenerateTeams = () => {
    const allIds = [...squadPlayers.map((p) => p.id), ...guestPlayers.map((g) => g.id)];
    const generated = generateTeams(allIds, numTeams);
    setTeams(generated);
    showToast(`${numTeams} balanced teams generated.`);
  };

  const handleAddGuestPlayer = (guestData) => {
    const newGuest = {
      id: `guest-${Date.now()}`,
      name: guestData.name,
      position: guestData.position,
      jerseyNumber: guestData.jerseyNumber,
      notes: guestData.notes,
      isGuest: true,
      ratings: { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 },
    };

    setGuestPlayers([...guestPlayers, newGuest]);

    if (guestData.targetTeamIdx >= 0 && guestData.targetTeamIdx < teams.length) {
      let updatedTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
      updatedTeams[guestData.targetTeamIdx].playerIds.push(newGuest.id);
      setTeams(updatedTeams);
    }
    showToast(`Guest "${newGuest.name}" added.`);
  };

  const handleRemoveGuestPlayer = (guestId) => {
    setGuestPlayers(guestPlayers.filter((g) => g.id !== guestId));
    setTeams(teams.map((t) => ({
      ...t,
      playerIds: t.playerIds.filter((pid) => pid !== guestId),
    })));
    showToast('Guest player removed.');
  };

  const handleMovePlayer = (playerId, fromIdx, toIdx) => {
    let newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
    if (fromIdx >= 0) {
      newTeams[fromIdx].playerIds = newTeams[fromIdx].playerIds.filter((pid) => pid !== playerId);
    }
    if (toIdx >= 0) {
      newTeams[toIdx].playerIds.push(playerId);
    }
    setTeams(newTeams);
    const dest = toIdx >= 0 ? newTeams[toIdx].name : 'Unassigned Bench';
    showToast(`Moved to ${dest}.`);
  };

  return (
    <div className="team-generator-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="welcome-hero-card" style={{ padding: '24px 28px' }}>
        <div className="hero-header-row" style={{ marginBottom: '16px' }}>
          <div className="hero-title-group">
            <h1 className="hero-title" style={{ fontSize: '28px' }}>Manual Team Builder</h1>
            <p className="hero-subtitle">
              Handcraft teams with custom lineups, add guest players, and drag &amp; drop players between teams.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-import-backup"
              onClick={() => setIsNewTeamModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>+ Add Team</span>
            </button>
            <button
              type="button"
              className="btn-dossier-action"
              onClick={() => setIsAddGuestOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={15} />
              <span>+ Add Guest Player</span>
            </button>
          </div>
        </div>

        {/* Quick controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={numTeams}
              onChange={(e) => setNumTeams(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: '#fff', fontSize: '13px' }}
            >
              <option value={2}>2 Teams</option>
              <option value={3}>3 Teams</option>
              <option value={4}>4 Teams</option>
            </select>
            <button
              type="button"
              onClick={handleAutoGenerateTeams}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--forest-green)', color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Shuffle size={14} />
              <span>Auto-Distribute</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearTeams}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #FECACA', backgroundColor: '#FFF5F5', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>Reset Lineups</span>
          </button>
        </div>
      </section>

      {/* Unassigned Pool / Bench */}
      <section
        onDragOver={(e) => handleDragOver(e, -1)}
        onDragLeave={(e) => handleDragLeave(e, -1)}
        onDrop={(e) => handleDrop(e, -1)}
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          backgroundColor: dragOverTarget === -1 ? '#ECFDF5' : '#fff',
          border: dragOverTarget === -1 ? '2px dashed #059669' : '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} style={{ color: 'var(--forest-green)' }} />
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              Available Squad Members &amp; Guests
            </strong>
            <span className="badge badge-peach" style={{ fontSize: '11px' }}>
              {unassignedAll.length} Unassigned
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Drag players into teams below
          </span>
        </div>

        {unassignedAll.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0' }}>
            All available squad members and guest players have been assigned to teams.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {unassignedAll.map((player) => (
              <div
                key={player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, player.id, -1)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'grab',
                  userSelect: 'none'
                }}
              >
                <GripVertical size={13} style={{ color: '#9CA3AF' }} />
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: player.isGuest ? '#FEF3C7' : 'var(--pale-green-bg)',
                  color: player.isGuest ? '#92400E' : 'var(--forest-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {player.jerseyNumber || '•'}
                </span>
                <strong style={{ fontSize: '13px' }}>{player.name}</strong>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 600 }}>
                  {player.position}
                </span>

                {player.isGuest && (
                  <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                    GUEST
                  </span>
                )}

                {player.isGuest && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGuestPlayer(player.id)}
                    style={{ color: '#EF4444', cursor: 'pointer', display: 'flex' }}
                    title="Remove Guest"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Teams Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
        gap: '16px'
      }}>
        {teams.map((team, teamIdx) => {
          const teamPlayerList = (team.playerIds || []).map((pid) => allPlayerMap[pid]).filter(Boolean);
          const isDragTarget = dragOverTarget === teamIdx;
          const themeColor = PRESET_TEAM_COLORS[teamIdx % PRESET_TEAM_COLORS.length];

          return (
            <div
              key={team.name || teamIdx}
              onDragOver={(e) => handleDragOver(e, teamIdx)}
              onDragLeave={(e) => handleDragLeave(e, teamIdx)}
              onDrop={(e) => handleDrop(e, teamIdx)}
              style={{
                backgroundColor: isDragTarget ? '#ECFDF5' : '#fff',
                borderRadius: '16px',
                border: isDragTarget ? '2px dashed #059669' : '1px solid var(--border-subtle)',
                padding: '18px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '260px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: themeColor.bg,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    {String.fromCharCode(65 + teamIdx)}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{team.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {teamPlayerList.length} Players
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTeam(teamIdx)}
                  title={`Delete ${team.name}`}
                  style={{ color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {teamPlayerList.length === 0 ? (
                <div style={{ padding: '36px 12px', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  Drag &amp; drop players here
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {teamPlayerList.map((player) => (
                    <div
                      key={player.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, player.id, teamIdx)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-subtle)',
                        cursor: 'grab',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GripVertical size={13} style={{ color: '#9CA3AF' }} />
                        <span style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: player.isGuest ? '#FEF3C7' : 'var(--pale-green-bg)',
                          color: player.isGuest ? '#92400E' : 'var(--forest-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {player.jerseyNumber || '•'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '13px' }}>{player.name}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{player.position}</span>
                            {player.isGuest && (
                              <span style={{ fontSize: '9px', padding: '0 4px', borderRadius: '3px', backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                                GUEST
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {player.isGuest && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGuestPlayer(player.id)}
                          style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', marginLeft: 'auto' }}
                          title="Remove Guest"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* New Team Modal */}
      {isNewTeamModalOpen && (
        <div className="modal-overlay-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setIsNewTeamModalOpen(false); }}>
          <div className="modal-content-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header-row">
              <h2 className="modal-heading">Create New Team</h2>
              <button type="button" className="btn-modal-close" onClick={() => setIsNewTeamModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTeamSubmit}>
              <div className="rating-input-field" style={{ margin: '14px 0' }}>
                <label className="rating-field-label">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Team ${String.fromCharCode(65 + teams.length)}`}
                  value={newTeamNameInput}
                  onChange={(e) => setNewTeamNameInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '14px' }}
                />
              </div>
              <div className="modal-actions-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsNewTeamModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <CheckCircle size={15} />
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Player Modal */}
      <GuestPlayerModal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        teams={teams}
        onSave={handleAddGuestPlayer}
      />
    </div>
  );
}
