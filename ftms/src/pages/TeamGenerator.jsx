import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  Shuffle, 
  GripVertical, 
  X, 
  RotateCcw,
  ArrowLeft,
  Trophy,
  Edit2
} from 'lucide-react';
import { playerService } from '../services/playerService';
import { generateTeams } from '../services/teamService';
import GuestPlayerModal from '../components/matches/GuestPlayerModal';
import TeamFormModal from '../components/matches/TeamFormModal';
import { PRESET_JERSEY_COLORS } from '../components/matches/teamColors';
import CreateMatchFromTeamsModal from '../components/matches/CreateMatchFromTeamsModal';

const DEFAULT_TEAMS = [
  { name: 'Team Green', color: '#003B1B', playerIds: [] },
  { name: 'Team White', color: '#4B5563', playerIds: [] },
];

export default function TeamGenerator() {
  const navigate = useNavigate();

  const [squadPlayers, setSquadPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restore draft from localStorage if available
  const [guestPlayers, setGuestPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('ftms_draft_guests');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load guest draft:', e);
    }
    return [];
  });

  const [teams, setTeams] = useState(() => {
    try {
      const saved = localStorage.getItem('ftms_draft_teams');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load teams draft:', e);
    }
    return DEFAULT_TEAMS;
  });

  const [numTeams, setNumTeams] = useState(() => {
    try {
      const saved = localStorage.getItem('ftms_draft_teams');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
      }
    } catch (e) {
      console.error('Failed to load team count from draft:', e);
    }
    return 2;
  });

  // Drag and Drop
  const [draggingPlayer, setDraggingPlayer] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Modals & inputs
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamIdx, setEditingTeamIdx] = useState(null); // null = new, number = edit
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    document.title = 'Manual Team Builder | Team Manager';
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

  // Save to draft in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ftms_draft_teams', JSON.stringify(teams));
    } catch (e) {
      console.error('Failed to save teams draft:', e);
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('ftms_draft_guests', JSON.stringify(guestPlayers));
    } catch (e) {
      console.error('Failed to save guest draft:', e);
    }
  }, [guestPlayers]);

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

  const handleSaveTeam = ({ name, color }) => {
    if (editingTeamIdx !== null) {
      setTeams(teams.map((t, idx) => idx === editingTeamIdx ? { ...t, name, color } : t));
      showToast(`"${name}" updated.`);
    } else {
      const newTeams = [...teams, { name, color, playerIds: [] }];
      setTeams(newTeams);
      setNumTeams(newTeams.length);
      showToast(`"${name}" created.`);
    }
    setEditingTeamIdx(null);
    setIsTeamModalOpen(false);
  };

  const handleDeleteTeam = (teamIdx) => {
    const team = teams[teamIdx];
    const newTeams = teams.filter((_, idx) => idx !== teamIdx);
    setTeams(newTeams);
    setNumTeams(Math.max(2, newTeams.length));
    showToast(`"${team.name}" removed.`);
  };

  const handleClearTeams = () => {
    try {
      localStorage.removeItem('ftms_draft_teams');
      localStorage.removeItem('ftms_draft_guests');
    } catch (e) {
      console.error(e);
    }
    setGuestPlayers([]);
    setTeams(DEFAULT_TEAMS);
    setNumTeams(DEFAULT_TEAMS.length);
    showToast('All team assignments cleared and returned to bench.');
  };

  const handleAutoGenerateTeams = () => {
    const allIds = [...squadPlayers.map((p) => p.id), ...guestPlayers.map((g) => g.id)];
    const generated = generateTeams(allIds, numTeams, teams);
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

  const handleMatchCreated = (matchId) => {
    try {
      localStorage.removeItem('ftms_draft_teams');
      localStorage.removeItem('ftms_draft_guests');
    } catch (e) {
      console.error(e);
    }
    navigate(`/matches/${matchId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading squad members...
      </div>
    );
  }

  return (
    <div className="team-generator-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => navigate('/matches')}
          className="btn-dossier-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Matches</span>
        </button>

        <button
          type="button"
          className="btn-import-backup"
          onClick={() => setIsCreateMatchOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--forest-green)',
            color: '#fff',
            fontWeight: 700,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Trophy size={16} />
          <span>Save &amp; Create Match</span>
        </button>
      </div>

      {/* Hero Header */}
      <section className="welcome-hero-card" style={{ padding: '24px 28px' }}>
        <div className="hero-header-row" style={{ marginBottom: '16px' }}>
          <div className="hero-title-group">
            <h1 className="hero-title" style={{ fontSize: '28px' }}>Manual Team Builder</h1>
            <p className="hero-subtitle">
              Handcraft teams with custom lineups and jersey colors, add guest players, and save directly into matches.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-import-backup"
              onClick={() => {
                setEditingTeamIdx(null);
                setIsTeamModalOpen(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add Team</span>
            </button>
            <button
              type="button"
              className="btn-dossier-action"
              onClick={() => setIsAddGuestOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={15} />
              <span>Add Guest Player</span>
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
              {Array.from({ length: Math.max(4, numTeams, teams.length) - 1 }, (_, i) => i + 2).map((count) => (
                <option key={count} value={count}>
                  {count} Teams
                </option>
              ))}
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
                    style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', border: 'none', background: 'none' }}
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
          const fallbackColor = PRESET_JERSEY_COLORS[teamIdx % PRESET_JERSEY_COLORS.length].bg;
          const teamColor = team.color || fallbackColor;

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
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    backgroundColor: teamColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }}>
                    {team.name ? team.name.charAt(0).toUpperCase() : String.fromCharCode(65 + teamIdx)}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{team.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {teamPlayerList.length} Players Assigned
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamIdx(teamIdx);
                      setIsTeamModalOpen(true);
                    }}
                    title={`Edit ${team.name} name & jersey color`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--forest-green)';
                      e.currentTarget.style.backgroundColor = 'var(--pale-green-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#6B7280';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTeam(teamIdx)}
                    title={`Delete ${team.name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#EF4444';
                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9CA3AF';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
                          style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', marginLeft: 'auto', border: 'none', background: 'none' }}
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

      {/* Team Form Modal (Create and Edit Team with Name & Jersey Color) */}
      <TeamFormModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setEditingTeamIdx(null);
        }}
        onSave={handleSaveTeam}
        teamToEdit={editingTeamIdx !== null ? teams[editingTeamIdx] : null}
        teamIndex={editingTeamIdx !== null ? editingTeamIdx : teams.length}
      />

      {/* Guest Player Modal */}
      <GuestPlayerModal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        teams={teams}
        onSave={handleAddGuestPlayer}
      />

      {/* Save & Create Match Modal */}
      <CreateMatchFromTeamsModal
        isOpen={isCreateMatchOpen}
        onClose={() => setIsCreateMatchOpen(false)}
        teams={teams}
        guestPlayers={guestPlayers}
        onSuccess={handleMatchCreated}
      />
    </div>
  );
}
