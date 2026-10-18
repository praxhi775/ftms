import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shuffle, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Trash2, 
  Edit3, 
  Award, 
  MoveRight, 
  ArrowLeftRight,
  Plus,
  UserPlus,
  GripVertical,
  X,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { matchService } from '../services/matchService';
import { playerService } from '../services/playerService';
import { statsService } from '../services/statsService';
import { generateTeams, movePlayer, swapPlayers } from '../services/teamService';
import MatchFormModal from '../components/matches/MatchFormModal';
import RecordStatsModal from '../components/matches/RecordStatsModal';
import GuestPlayerModal from '../components/matches/GuestPlayerModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const PRESET_TEAM_COLORS = [
  { name: 'Team Green', bg: '#003B1B', light: '#ECFDF5', border: '#A7F3D0', text: '#003B1B' },
  { name: 'Team White', bg: '#4B5563', light: '#F9FAFB', border: '#E5E7EB', text: '#1F2937' },
  { name: 'Team Blue', bg: '#1E40AF', light: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  { name: 'Team Orange', bg: '#C2410C', light: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  { name: 'Team Purple', bg: '#6B21A8', light: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8' },
  { name: 'Team Gold', bg: '#854D0E', light: '#FEFCE8', border: '#FEF08A', text: '#854D0E' },
];

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [guestPlayers, setGuestPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Teams configuration
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState([]);

  // Drag and Drop State
  const [draggingPlayer, setDraggingPlayer] = useState(null); // { id, fromTeamIdx }
  const [dragOverTarget, setDragOverTarget] = useState(null); // teamIdx or -1

  // Swap / Move state
  const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState(null); // { playerId, teamIndex }

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordStatsOpen, setIsRecordStatsOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [statDefs, setStatDefs] = useState([]);
  const [existingStats, setExistingStats] = useState([]);

  // Complete match state
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadMatchData = async () => {
    try {
      setLoading(true);
      const matchId = Number(id);
      const m = await matchService.getById(matchId);
      if (!m) {
        setError('Match fixture not found.');
        return;
      }
      setMatch(m);

      if (m.teams && m.teams.length > 0) {
        setTeams(m.teams);
        setNumTeams(m.teams.length);
      } else {
        setTeams([]);
      }

      setGuestPlayers(m.guestPlayers || []);

      if (m.score) {
        setScoreHome(m.score.home);
        setScoreAway(m.score.away);
      }

      // Load selected players details
      if (m.selectedPlayerIds && m.selectedPlayerIds.length > 0) {
        const all = await playerService.getAll();
        const selected = all.filter((p) => m.selectedPlayerIds.includes(p.id));
        setSquadPlayers(selected);
      } else {
        setSquadPlayers([]);
      }

      // Load stat defs and existing stats
      const [defs, recorded] = await Promise.all([
        statsService.getAllDefinitions(),
        statsService.getStatsForMatch(matchId),
      ]);
      setStatDefs(defs);
      setExistingStats(recorded);
    } catch (err) {
      console.error('Failed to load match:', err);
      setError('An error occurred loading match fixture.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Combined Player Lookup (Regular squad members + Guest players)
  const allPlayerMap = {};
  squadPlayers.forEach((p) => {
    allPlayerMap[p.id] = p;
  });
  guestPlayers.forEach((g) => {
    allPlayerMap[g.id] = { ...g, isGuest: true };
  });

  // Calculate Unassigned Players (squad + guests not currently in any team)
  const assignedPlayerIds = new Set(teams.flatMap((t) => t.playerIds || []));
  const unassignedSquad = squadPlayers.filter((p) => !assignedPlayerIds.has(p.id));
  const unassignedGuests = guestPlayers.filter((g) => !assignedPlayerIds.has(g.id));
  const unassignedAll = [...unassignedSquad, ...unassignedGuests];

  // --- Drag and Drop Handlers ---
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
    if (dragOverTarget !== targetTeamIdx) {
      setDragOverTarget(targetTeamIdx);
    }
  };

  const handleDragLeave = (e, targetTeamIdx) => {
    if (dragOverTarget === targetTeamIdx) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = async (e, targetTeamIdx) => {
    e.preventDefault();
    setDragOverTarget(null);

    let dragData = draggingPlayer;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) dragData = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse drag data:', err);
      }
    }

    if (!dragData) return;
    const { playerId, fromTeamIdx } = dragData;
    if (fromTeamIdx === targetTeamIdx) return;

    let newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));

    // Remove from previous team if it came from one
    if (fromTeamIdx >= 0 && fromTeamIdx < newTeams.length) {
      newTeams[fromTeamIdx].playerIds = newTeams[fromTeamIdx].playerIds.filter((pid) => pid !== playerId);
    }

    // Add to target team if target is a team (targetTeamIdx >= 0)
    if (targetTeamIdx >= 0 && targetTeamIdx < newTeams.length) {
      if (!newTeams[targetTeamIdx].playerIds.includes(playerId)) {
        newTeams[targetTeamIdx].playerIds.push(playerId);
      }
    }

    setTeams(newTeams);
    setSelectedPlayerToSwap(null);
    setDraggingPlayer(null);

    await matchService.saveTeams(match.id, newTeams, guestPlayers);
    const pName = allPlayerMap[playerId]?.name || 'Player';
    const destination = targetTeamIdx >= 0 ? newTeams[targetTeamIdx].name : 'Unassigned Bench';
    showToast(`${pName} moved to ${destination}.`);
  };

  // --- Manual Team Management ---
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    const name = newTeamNameInput.trim() || `Team ${String.fromCharCode(65 + teams.length)}`;
    const newTeam = {
      name,
      playerIds: [],
    };
    const updated = [...teams, newTeam];
    setTeams(updated);
    setNumTeams(updated.length);
    setNewTeamNameInput('');
    setIsNewTeamModalOpen(false);

    await matchService.saveTeams(match.id, updated, guestPlayers);
    showToast(`"${name}" created. Drag players into this team!`);
  };

  const handleDeleteTeam = async (teamIdx) => {
    const teamToDelete = teams[teamIdx];
    const updated = teams.filter((_, idx) => idx !== teamIdx);
    setTeams(updated);
    setNumTeams(updated.length);

    await matchService.saveTeams(match.id, updated, guestPlayers);
    showToast(`"${teamToDelete.name}" removed. Assigned players returned to bench.`);
  };

  const handleClearTeams = async () => {
    setTeams([]);
    setSelectedPlayerToSwap(null);
    await matchService.saveTeams(match.id, [], guestPlayers);
    showToast('All teams cleared. Squad members returned to unassigned pool.');
  };

  // Auto-generate teams
  const handleAutoGenerateTeams = async () => {
    const allAvailableIds = [...squadPlayers.map((p) => p.id), ...guestPlayers.map((g) => g.id)];
    if (allAvailableIds.length === 0) {
      showToast('No players or guests available for this match.');
      return;
    }

    const generated = generateTeams(allAvailableIds, numTeams);
    setTeams(generated);
    setSelectedPlayerToSwap(null);

    await matchService.saveTeams(match.id, generated, guestPlayers);
    setMatch((prev) => ({ ...prev, teams: generated }));
    showToast(`${numTeams} balanced teams auto-generated & saved.`);
  };

  // Guest Player Add / Remove
  const handleAddGuestPlayer = async (guestData) => {
    const newGuest = {
      id: `guest-${Date.now()}`,
      name: guestData.name,
      position: guestData.position,
      jerseyNumber: guestData.jerseyNumber,
      notes: guestData.notes,
      isGuest: true,
      ratings: { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 },
    };

    const updatedGuests = [...guestPlayers, newGuest];
    setGuestPlayers(updatedGuests);

    let updatedTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
    if (guestData.targetTeamIdx >= 0 && guestData.targetTeamIdx < updatedTeams.length) {
      updatedTeams[guestData.targetTeamIdx].playerIds.push(newGuest.id);
      setTeams(updatedTeams);
    }

    await matchService.saveTeams(match.id, updatedTeams, updatedGuests);
    showToast(`Guest player "${newGuest.name}" added to match roster.`);
  };

  const handleRemoveGuestPlayer = async (guestId) => {
    const guest = guestPlayers.find((g) => g.id === guestId);
    const updatedGuests = guestPlayers.filter((g) => g.id !== guestId);
    setGuestPlayers(updatedGuests);

    const updatedTeams = teams.map((t) => ({
      ...t,
      playerIds: t.playerIds.filter((pid) => pid !== guestId),
    }));
    setTeams(updatedTeams);

    await matchService.saveTeams(match.id, updatedTeams, updatedGuests);
    showToast(`Guest "${guest?.name || ''}" removed.`);
  };

  // Click-to-swap fallback for accessibility
  const handlePlayerClick = async (playerId, teamIndex) => {
    if (!selectedPlayerToSwap) {
      setSelectedPlayerToSwap({ playerId, teamIndex });
      showToast('Player selected. Click another player to SWAP or an arrow to MOVE.');
    } else {
      if (selectedPlayerToSwap.teamIndex === teamIndex && selectedPlayerToSwap.playerId === playerId) {
        setSelectedPlayerToSwap(null);
        return;
      }

      if (selectedPlayerToSwap.teamIndex === -1 && teamIndex >= 0) {
        // Move from unassigned to team
        let newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
        newTeams[teamIndex].playerIds.push(selectedPlayerToSwap.playerId);
        setTeams(newTeams);
        setSelectedPlayerToSwap(null);
        await matchService.saveTeams(match.id, newTeams, guestPlayers);
        showToast('Player added to team.');
        return;
      }

      const newTeams = swapPlayers(
        teams,
        selectedPlayerToSwap.playerId,
        selectedPlayerToSwap.teamIndex,
        playerId,
        teamIndex
      );

      setTeams(newTeams);
      setSelectedPlayerToSwap(null);
      await matchService.saveTeams(match.id, newTeams, guestPlayers);
      showToast('Players swapped successfully.');
    }
  };

  const handleMovePlayerToTeam = async (playerId, fromTeamIdx, toTeamIdx) => {
    let newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
    if (fromTeamIdx >= 0) {
      newTeams[fromTeamIdx].playerIds = newTeams[fromTeamIdx].playerIds.filter((pid) => pid !== playerId);
    }
    if (toTeamIdx >= 0) {
      newTeams[toTeamIdx].playerIds.push(playerId);
    }
    setTeams(newTeams);
    setSelectedPlayerToSwap(null);
    await matchService.saveTeams(match.id, newTeams, guestPlayers);
    const dest = toTeamIdx >= 0 ? newTeams[toTeamIdx].name : 'Unassigned Bench';
    showToast(`Player moved to ${dest}.`);
  };

  const handleCompleteMatch = async (e) => {
    e.preventDefault();
    try {
      const scoreObj = { home: Number(scoreHome), away: Number(scoreAway) };
      await matchService.completeMatch(match.id, scoreObj, match.notes);
      setMatch((prev) => ({
        ...prev,
        status: 'completed',
        score: scoreObj,
      }));
      setIsScoreModalOpen(false);
      showToast('Match marked completed with score logged.');
    } catch (err) {
      showToast(err.message || 'Failed to complete match');
    }
  };

  const handleDeleteMatch = async () => {
    try {
      await matchService.remove(match.id);
      navigate('/matches');
    } catch (err) {
      showToast(err.message || 'Failed to delete match');
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading match details...
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="placeholder-page-container">
        <div className="placeholder-content-card" style={{ textAlign: 'center' }}>
          <h2>{error || 'Match Not Found'}</h2>
          <Link to="/matches" className="btn-directive" style={{ marginTop: '16px', display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="match-details-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="dossier-header-bar">
        <nav className="dossier-breadcrumb" aria-label="Breadcrumb">
          <Link to="/matches" className="breadcrumb-root" style={{ color: 'var(--forest-green)', textDecoration: 'none', fontWeight: 600 }}>
            Matches
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{match.title}</span>
        </nav>

        <div className="dossier-header-actions" style={{ display: 'flex', gap: '8px' }}>
          {match.status === 'upcoming' ? (
            <button
              type="button"
              className="btn-dossier-action btn-edit-ratings"
              onClick={() => setIsScoreModalOpen(true)}
            >
              <CheckCircle size={15} />
              <span>Complete Match</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-dossier-action btn-edit-ratings"
              onClick={() => setIsRecordStatsOpen(true)}
            >
              <Award size={15} />
              <span>Record Player Stats</span>
            </button>
          )}

          <button
            type="button"
            className="btn-dossier-action btn-export-sheet"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 size={15} />
            <span>Edit Match</span>
          </button>

          <button
            type="button"
            className="btn-dossier-action"
            onClick={() => setIsDeleteModalOpen(true)}
            style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </header>

      {/* Match Overview Banner */}
      <section className="welcome-hero-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`badge ${match.status === 'completed' ? 'badge-green' : 'badge-peach'}`}>
                {match.status}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {match.matchType}
              </span>
            </div>
            <h1 className="hero-title" style={{ fontSize: '26px' }}>
              {match.title}
            </h1>
            <p className="hero-subtitle">
              {match.opponent ? `Fixture vs ${match.opponent}` : 'Internal Squad Friendly'}
            </p>
          </div>

          {match.status === 'completed' && match.score && (
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '12px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Final Score
              </span>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--forest-green)', marginTop: '2px' }}>
                {match.score.home} - {match.score.away}
              </div>
            </div>
          )}
        </div>

        {/* Fixture Metadata */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} style={{ color: 'var(--forest-green)' }} />
            <span>{match.date} {match.time ? `at ${match.time}` : ''}</span>
          </div>
          {match.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} style={{ color: 'var(--forest-green)' }} />
              <span>{match.venue}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} style={{ color: 'var(--forest-green)' }} />
            <span>{squadPlayers.length} Squad + {guestPlayers.length} Guests ({squadPlayers.length + guestPlayers.length} total)</span>
          </div>
        </div>

        {match.notes && (
          <p style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '8px' }}>
            Note: {match.notes}
          </p>
        )}
      </section>

      {/* Team Builder Card (Manual Creation + Guest Players + Drag & Drop) */}
      <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--forest-green)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Squad Formation &amp; Lineups
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Create teams manually or auto-generate, add guest trialists, and drag &amp; drop players to assemble lineups.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {/* Add Team Manually */}
            <button
              type="button"
              className="btn-import-backup"
              onClick={() => setIsNewTeamModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '12.5px' }}
            >
              <Plus size={14} />
              <span>+ Add Team</span>
            </button>

            {/* Add Guest Player */}
            <button
              type="button"
              className="btn-dossier-action"
              onClick={() => setIsAddGuestOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '12.5px', borderColor: 'var(--border-strong)' }}
            >
              <UserPlus size={14} />
              <span>+ Add Guest Player</span>
            </button>

            {/* Auto Generate Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <select
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                style={{
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#fff',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value={2}>2 Teams</option>
                <option value={3}>3 Teams</option>
                <option value={4}>4 Teams</option>
              </select>

              <button
                type="button"
                onClick={handleAutoGenerateTeams}
                title="Auto-Distribute Available Squad Evenly"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--forest-green)',
                  color: '#fff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Shuffle size={12} />
                <span>Auto-Distribute</span>
              </button>
            </div>

            {teams.length > 0 && (
              <button
                type="button"
                onClick={handleClearTeams}
                title="Clear All Teams and return players to unassigned bench"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #FECACA',
                  backgroundColor: '#FFF5F5',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Tip Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          backgroundColor: '#FAF8F3',
          border: '1px solid #ECE7DD',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GripVertical size={14} style={{ color: 'var(--forest-green)' }} />
            <span>
              <strong>Drag &amp; Drop:</strong> Grab any player card by its handle to move between teams or drop onto the Unassigned Bench.
            </span>
          </div>
          {selectedPlayerToSwap && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#1E40AF', fontWeight: 600 }}>
                Selected: {allPlayerMap[selectedPlayerToSwap.playerId]?.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlayerToSwap(null)}
                style={{ fontSize: '11px', textDecoration: 'underline', color: '#1E40AF', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* UNASSIGNED SQUAD / BENCH POOL (Drop Target) */}
        <div
          onDragOver={(e) => handleDragOver(e, -1)}
          onDragLeave={(e) => handleDragLeave(e, -1)}
          onDrop={(e) => handleDrop(e, -1)}
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: dragOverTarget === -1 ? '#ECFDF5' : '#F9FAFB',
            border: dragOverTarget === -1 ? '2px dashed #059669' : '1px solid #E5E7EB',
            transition: 'all 0.15s ease',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--text-muted)' }} />
              <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Unassigned Players / Bench Pool
              </strong>
              <span className="badge badge-peach" style={{ fontSize: '11px' }}>
                {unassignedAll.length} available
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Drop here to unassign from teams
            </span>
          </div>

          {unassignedAll.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0', fontStyle: 'italic' }}>
              All {squadPlayers.length + guestPlayers.length} squad members and guests have been assigned to teams.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {unassignedAll.map((player) => {
                const isSelected = selectedPlayerToSwap?.playerId === player.id;
                const isDragging = draggingPlayer?.playerId === player.id;

                return (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player.id, -1)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handlePlayerClick(player.id, -1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                      border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      cursor: 'grab',
                      opacity: isDragging ? 0.4 : 1,
                      userSelect: 'none',
                      transition: 'transform 0.1s ease',
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
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                      {player.name}
                    </strong>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: '#F3F4F6',
                      color: '#4B5563',
                      fontWeight: 600
                    }}>
                      {player.position}
                    </span>

                    {player.isGuest && (
                      <span style={{
                        fontSize: '9.5px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 700
                      }}>
                        GUEST
                      </span>
                    )}

                    {player.isGuest && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGuestPlayer(player.id);
                        }}
                        title="Remove Guest"
                        style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TEAMS GRID (Drop Targets) */}
        {teams.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            backgroundColor: '#FAF8F3',
            borderRadius: '14px',
            border: '2px dashed #E5E7EB'
          }}>
            <Users size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Teams Created Yet
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px' }}>
              Create teams manually using "+ Add Team" to handpick rosters, or click "Auto-Distribute" to divide squad members automatically.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-import-backup"
                onClick={() => setIsNewTeamModalOpen(true)}
              >
                <Plus size={14} />
                <span>+ Create First Team</span>
              </button>
              <button
                type="button"
                className="btn-dossier-action"
                onClick={handleAutoGenerateTeams}
              >
                <Shuffle size={14} />
                <span>Auto-Distribute Squad</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
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
                    transition: 'all 0.15s ease',
                    minHeight: '260px'
                  }}
                >
                  {/* Team Card Header */}
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
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {team.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {teamPlayerList.length} Players Assigned
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(teamIdx)}
                        title={`Delete ${team.name}`}
                        style={{
                          color: '#9CA3AF',
                          padding: '4px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Drop zone helper if empty */}
                  {teamPlayerList.length === 0 ? (
                    <div style={{
                      padding: '30px 10px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: '1px dashed #D1D5DB',
                      color: 'var(--text-muted)',
                      fontSize: '12px'
                    }}>
                      Drop players here to assign to {team.name}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {teamPlayerList.map((player) => {
                        const isSelected = selectedPlayerToSwap?.playerId === player.id;
                        const isDragging = draggingPlayer?.playerId === player.id;

                        return (
                          <div
                            key={player.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, player.id, teamIdx)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handlePlayerClick(player.id, teamIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#EFF6FF' : 'var(--bg-subtle)',
                              border: isSelected ? '1px solid #3B82F6' : '1px solid transparent',
                              cursor: 'grab',
                              opacity: isDragging ? 0.35 : 1,
                              userSelect: 'none',
                              transition: 'all 0.12s ease',
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
                                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                                  {player.name}
                                </strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                    {player.position}
                                  </span>
                                  {player.isGuest && (
                                    <span style={{
                                      fontSize: '9px',
                                      padding: '0 4px',
                                      borderRadius: '3px',
                                      backgroundColor: '#FEF3C7',
                                      color: '#92400E',
                                      fontWeight: 700
                                    }}>
                                      GUEST
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {player.isGuest && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveGuestPlayer(player.id);
                                }}
                                title="Remove Guest"
                                style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Manual Team Creation Modal */}
      {isNewTeamModalOpen && (
        <div className="modal-overlay-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setIsNewTeamModalOpen(false); }}>
          <div className="modal-content-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header-row">
              <h2 className="modal-heading">Create New Team</h2>
              <button type="button" className="btn-modal-close" onClick={() => setIsNewTeamModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-description">Add a new squad lineup for this match fixture.</p>

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

      {/* Add Guest Player Modal */}
      <GuestPlayerModal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        teams={teams}
        onSave={handleAddGuestPlayer}
      />

      {/* Edit Match Modal */}
      <MatchFormModal
        isOpen={isEditModalOpen}
        matchToEdit={match}
        onClose={() => setIsEditModalOpen(false)}
        onMatchSaved={() => {
          loadMatchData();
          showToast('Match fixture details updated.');
        }}
      />

      {/* Complete Match Modal (Score entry) */}
      {isScoreModalOpen && (
        <div className="modal-overlay-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content-card" style={{ maxWidth: '400px' }}>
            <h2 className="modal-heading" style={{ marginBottom: '8px' }}>Log Final Match Score</h2>
            <p className="modal-description">Enter final result to mark fixture completed.</p>

            <form onSubmit={handleCompleteMatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
                <div className="rating-input-field">
                  <label className="rating-field-label">Home / Team A</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreHome}
                    onChange={(e) => setScoreHome(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-strong)', textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
                  />
                </div>
                <div className="rating-input-field">
                  <label className="rating-field-label">Away / Team B</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreAway}
                    onChange={(e) => setScoreAway(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-strong)', textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsScoreModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Confirm &amp; Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Stats Modal */}
      {isRecordStatsOpen && (
        <RecordStatsModal
          isOpen={isRecordStatsOpen}
          match={match}
          players={[...squadPlayers, ...guestPlayers]}
          statDefinitions={statDefs}
          existingStats={existingStats}
          onClose={() => setIsRecordStatsOpen(false)}
          onStatsSaved={() => {
            loadMatchData();
            showToast('Player match stats saved to ledger.');
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Delete Match Fixture"
        message={`Are you sure you want to delete ${match.title}? All associated match stats and team rosters will be removed.`}
        confirmLabel="Delete Match"
        confirmVariant="danger"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteMatch}
      />
    </div>
  );
}
