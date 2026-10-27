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
  RotateCcw,
  Edit2,
  Lock,
  Activity
} from 'lucide-react';
import { matchService } from '../services/matchService';
import { playerService, calcOverall } from '../services/playerService';
import { statsService } from '../services/statsService';
import { generateTeams, movePlayer, swapPlayers } from '../services/teamService';
import MatchFormModal from '../components/matches/MatchFormModal';
import RecordStatsModal from '../components/matches/RecordStatsModal';
import RecordActivityModal from '../components/matches/RecordActivityModal';
import { ACTIVITY_TYPES } from '../components/matches/activityTypes';
import GuestPlayerModal from '../components/matches/GuestPlayerModal';
import TeamFormModal from '../components/matches/TeamFormModal';
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
  const [dragOverPlayerId, setDragOverPlayerId] = useState(null);

  // Swap / Move state
  const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState(null); // { playerId, teamIndex }

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordStatsOpen, setIsRecordStatsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamIdx, setEditingTeamIdx] = useState(null);
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

  const isCompleted = match?.status === 'completed';

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, playerId, fromTeamIdx) => {
    if (isCompleted) {
      e.preventDefault();
      return;
    }
    setDraggingPlayer({ playerId, fromTeamIdx });
    e.dataTransfer.setData('text/plain', JSON.stringify({ playerId, fromTeamIdx }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingPlayer(null);
    setDragOverTarget(null);
    setDragOverPlayerId(null);
  };

  const handleDragOver = (e, targetTeamIdx) => {
    if (isCompleted) return;
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
    if (isCompleted) {
      showToast('Cannot modify team lineups for a completed match.');
      return;
    }
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

  const handleDropOnPlayer = async (e, targetPlayerId, targetTeamIdx) => {
    if (isCompleted) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    setDragOverPlayerId(null);

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
    if (playerId === targetPlayerId) return;

    let newTeams = teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
    if (fromTeamIdx >= 0 && fromTeamIdx < newTeams.length) {
      newTeams[fromTeamIdx].playerIds = newTeams[fromTeamIdx].playerIds.filter((pid) => pid !== playerId);
    }
    if (targetTeamIdx >= 0 && targetTeamIdx < newTeams.length) {
      const team = newTeams[targetTeamIdx];
      team.playerIds = team.playerIds.filter((pid) => pid !== playerId);
      const dropIdx = team.playerIds.indexOf(targetPlayerId);
      if (dropIdx !== -1) {
        team.playerIds.splice(dropIdx, 0, playerId);
      } else {
        team.playerIds.push(playerId);
      }
      team.sortBy = 'manual';
    }

    setTeams(newTeams);
    setSelectedPlayerToSwap(null);
    setDraggingPlayer(null);

    if (match) {
      await matchService.saveTeams(match.id, newTeams, guestPlayers);
    }
    const pName = allPlayerMap[playerId]?.name || 'Player';
    showToast(`${pName} repositioned.`);
  };

  const handleTeamSortChange = async (teamIdx, newSortBy) => {
    const updated = teams.map((t, idx) => {
      if (idx !== teamIdx) return t;
      let newIds = [...t.playerIds];
      if (newSortBy === 'position') {
        const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
        newIds.sort((aId, bId) => {
          const a = allPlayerMap[aId];
          const b = allPlayerMap[bId];
          if (!a || !b) return 0;
          const diff = (posOrder[a.position] || 99) - (posOrder[b.position] || 99);
          if (diff !== 0) return diff;
          return calcOverall(b) - calcOverall(a);
        });
      } else if (newSortBy === 'stats') {
        newIds.sort((aId, bId) => {
          const a = allPlayerMap[aId];
          const b = allPlayerMap[bId];
          if (!a || !b) return 0;
          const diff = calcOverall(b) - calcOverall(a);
          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        });
      }
      return { ...t, sortBy: newSortBy, playerIds: newIds };
    });
    setTeams(updated);
    if (match) {
      await matchService.saveTeams(match.id, updated, guestPlayers);
    }
    showToast(`Sorted ${teams[teamIdx]?.name || 'team'} by ${newSortBy}.`);
  };

  const getSortedPlayerList = (team) => {
    const list = (team.playerIds || []).map((pid) => allPlayerMap[pid]).filter(Boolean);
    const mode = team.sortBy || 'manual';
    if (mode === 'position') {
      const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
      return [...list].sort((a, b) => {
        const diff = (posOrder[a.position] || 99) - (posOrder[b.position] || 99);
        if (diff !== 0) return diff;
        return calcOverall(b) - calcOverall(a);
      });
    }
    if (mode === 'stats') {
      return [...list].sort((a, b) => {
        const diff = calcOverall(b) - calcOverall(a);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
    }
    return list;
  };

  // --- Manual Team Management ---
  const handleSaveTeam = async ({ name, color }) => {
    if (isCompleted) {
      showToast('Cannot modify teams for a completed match.');
      return;
    }
    let updated;
    if (editingTeamIdx !== null) {
      updated = teams.map((t, idx) => idx === editingTeamIdx ? { ...t, name, color } : t);
      showToast(`"${name}" updated.`);
    } else {
      const newTeam = {
        name,
        color,
        playerIds: [],
      };
      updated = [...teams, newTeam];
      showToast(`"${name}" created. Drag players into this team!`);
    }
    setTeams(updated);
    setNumTeams(updated.length);
    setEditingTeamIdx(null);
    setIsTeamModalOpen(false);

    await matchService.saveTeams(match.id, updated, guestPlayers);
  };

  const handleDeleteTeam = async (teamIdx) => {
    if (isCompleted) {
      showToast('Cannot delete teams for a completed match.');
      return;
    }
    const teamToDelete = teams[teamIdx];
    const updated = teams.filter((_, idx) => idx !== teamIdx);
    setTeams(updated);
    setNumTeams(updated.length);

    await matchService.saveTeams(match.id, updated, guestPlayers);
    showToast(`"${teamToDelete.name}" removed. Assigned players returned to bench.`);
  };

  const handleClearTeams = async () => {
    if (isCompleted) {
      showToast('Cannot reset lineups for a completed match.');
      return;
    }
    setTeams([]);
    setSelectedPlayerToSwap(null);
    await matchService.saveTeams(match.id, [], guestPlayers);
    showToast('All teams cleared. Squad members returned to unassigned pool.');
  };

  // Auto-generate teams
  const handleAutoGenerateTeams = async () => {
    if (isCompleted) {
      showToast('Cannot reallocate players for a completed match.');
      return;
    }
    const allAvailableIds = [...squadPlayers.map((p) => p.id), ...guestPlayers.map((g) => g.id)];
    if (allAvailableIds.length === 0) {
      showToast('No players or guests available for this match.');
      return;
    }

    const generated = generateTeams(allAvailableIds, numTeams, teams);
    setTeams(generated);
    setSelectedPlayerToSwap(null);

    await matchService.saveTeams(match.id, generated, guestPlayers);
    setMatch((prev) => ({ ...prev, teams: generated }));
    showToast(`${numTeams} balanced teams auto-generated & saved.`);
  };

  // Guest Player Add / Remove
  const handleAddGuestPlayer = async (guestData) => {
    if (isCompleted) {
      showToast('Cannot add guest players to a completed match.');
      return;
    }
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
    if (isCompleted) {
      showToast('Cannot remove guest players from a completed match.');
      return;
    }
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
    if (isCompleted) return;
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
    if (isCompleted) return;
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

  // Goals recorded via Record Activity, counted per team (Team A = home, Team B = away)
  const recordedGoals = (() => {
    const counts = [0, 0];
    (match?.events || []).forEach((ev) => {
      if (ev.type !== 'goal') return;
      const idx = teams.findIndex((t) => (t.playerIds || []).includes(ev.playerId));
      if (idx === 0 || idx === 1) counts[idx] += 1;
    });
    return { home: counts[0], away: counts[1] };
  })();

  const openScoreModal = () => {
    setScoreHome(recordedGoals.home);
    setScoreAway(recordedGoals.away);
    setIsScoreModalOpen(true);
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

  const handleSaveActivity = async (event) => {
    await matchService.addEvent(match.id, event);
    await loadMatchData();
    showToast(`${ACTIVITY_TYPES[event.type].label} recorded.`);
  };

  const handleRemoveActivity = async (eventId) => {
    try {
      await matchService.removeEvent(match.id, eventId);
      await loadMatchData();
      showToast('Activity removed.');
    } catch (err) {
      showToast(err.message || 'Failed to remove activity');
    }
  };

  const handleDeleteMatch = async () => {
    if (isCompleted) {
      showToast('Completed matches cannot be deleted.');
      setIsDeleteModalOpen(false);
      return;
    }
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
          <button
            type="button"
            className="btn-dossier-action btn-export-sheet"
            onClick={() => setIsActivityOpen(true)}
            title="Record a goal or foul"
          >
            <Activity size={15} />
            <span>Record Activity</span>
          </button>

          {match.status === 'upcoming' ? (
            <button
              type="button"
              className="btn-dossier-action btn-edit-ratings"
              onClick={openScoreModal}
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

          {!isCompleted && (
            <button
              type="button"
              className="btn-dossier-action btn-export-sheet"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 size={15} />
              <span>Edit Match</span>
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              className="btn-dossier-action"
              onClick={() => setIsDeleteModalOpen(true)}
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          )}
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

      {/* Match Activity Log (goals & fouls) */}
      {(() => {
        const events = [...(match.events || [])].sort((a, b) => {
          const am = a.minute ?? Infinity;
          const bm = b.minute ?? Infinity;
          if (am !== bm) return am - bm;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        const teamOfPlayer = {};
        teams.forEach((t, idx) => {
          (t.playerIds || []).forEach((pid) => {
            teamOfPlayer[pid] = t.name || `Team ${String.fromCharCode(65 + idx)}`;
          });
        });
        const goals = events.filter((e) => e.type === 'goal');
        const fouls = events.filter((e) => e.type === 'foul');
        const goalsByTeam = {};
        goals.forEach((e) => {
          const t = teamOfPlayer[e.playerId];
          if (t) goalsByTeam[t] = (goalsByTeam[t] || 0) + 1;
        });

        return (
          <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} style={{ color: 'var(--forest-green)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Match Activity</h2>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Goals and fouls recorded for this match.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, backgroundColor: ACTIVITY_TYPES.goal.bg, color: ACTIVITY_TYPES.goal.color }}>
                  {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, backgroundColor: ACTIVITY_TYPES.foul.bg, color: ACTIVITY_TYPES.foul.color }}>
                  {fouls.length} {fouls.length === 1 ? 'Foul' : 'Fouls'}
                </span>
              </div>
            </div>

            {Object.keys(goalsByTeam).length > 0 && (
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Goals by team: {Object.entries(goalsByTeam).map(([t, n]) => `${t} ${n}`).join(' · ')}
              </p>
            )}

            {events.length === 0 ? (
              <div style={{ padding: '22px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', borderRadius: '12px' }}>
                No activity recorded yet. Use <strong>Record Activity</strong> to log a goal or foul.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map((ev) => {
                  const cfg = ACTIVITY_TYPES[ev.type] || ACTIVITY_TYPES.goal;
                  const Icon = cfg.icon;
                  const player = allPlayerMap[ev.playerId];
                  return (
                    <li
                      key={ev.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '1px solid var(--border-subtle)', borderRadius: '10px', backgroundColor: 'var(--bg-subtle)' }}
                    >
                      <span style={{ minWidth: '38px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {ev.minute != null ? `${ev.minute}'` : '—'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        <Icon size={12} strokeWidth={2.4} />
                        {cfg.label}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {player ? player.name : 'Unknown player'}
                        </strong>
                        {teamOfPlayer[ev.playerId] && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {teamOfPlayer[ev.playerId]}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(ev.id)}
                        aria-label={`Remove ${cfg.label} by ${player ? player.name : 'player'}`}
                        title="Remove"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'inline-flex', padding: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })()}

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
              {isCompleted
                ? 'Official final lineups recorded for this match. Player allocation and rosters are locked.'
                : 'Create teams manually or auto-generate, add guest trialists, and drag & drop players to assemble lineups.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {isCompleted ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                color: '#92400E',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <Lock size={13} />
                <span>Lineups Locked (Match Completed)</span>
              </div>
            ) : (
              <>
                {/* Add Team Manually */}
                <button
                  type="button"
                  className="btn-import-backup"
                  onClick={() => {
                    setEditingTeamIdx(null);
                    setIsTeamModalOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '12.5px' }}
                >
                  <Plus size={14} />
                  <span>Add Team</span>
                </button>

                {/* Add Guest Player */}
                <button
                  type="button"
                  className="btn-dossier-action"
                  onClick={() => setIsAddGuestOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '12.5px', borderColor: 'var(--border-strong)' }}
                >
                  <UserPlus size={14} />
                  <span>Add Guest Player</span>
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
                    {Array.from({ length: Math.max(4, numTeams, teams.length) - 1 }, (_, i) => i + 2).map((count) => (
                      <option key={count} value={count}>
                        {count} Teams
                      </option>
                    ))}
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
              </>
            )}
          </div>
        </div>

        {/* Tip Banner */}
        {!isCompleted && (
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
        )}

        {/* UNASSIGNED SQUAD / BENCH POOL (Drop Target) */}
        <div
          onDragOver={isCompleted ? undefined : (e) => handleDragOver(e, -1)}
          onDragLeave={isCompleted ? undefined : (e) => handleDragLeave(e, -1)}
          onDrop={isCompleted ? undefined : (e) => handleDrop(e, -1)}
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: !isCompleted && dragOverTarget === -1 ? '#ECFDF5' : '#F9FAFB',
            border: !isCompleted && dragOverTarget === -1 ? '2px dashed #059669' : '1px solid #E5E7EB',
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
            {!isCompleted && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Drop here to unassign from teams
              </span>
            )}
          </div>

          {unassignedAll.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0', fontStyle: 'italic' }}>
              All {squadPlayers.length + guestPlayers.length} squad members and guests have been assigned to teams.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {unassignedAll.map((player) => {
                const isSelected = !isCompleted && selectedPlayerToSwap?.playerId === player.id;
                const isDragging = !isCompleted && draggingPlayer?.playerId === player.id;

                return (
                  <div
                    key={player.id}
                    draggable={!isCompleted}
                    onDragStart={isCompleted ? undefined : (e) => handleDragStart(e, player.id, -1)}
                    onDragEnd={isCompleted ? undefined : handleDragEnd}
                    onClick={isCompleted ? undefined : () => handlePlayerClick(player.id, -1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                      border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      cursor: isCompleted ? 'default' : 'grab',
                      opacity: isDragging ? 0.4 : 1,
                      userSelect: 'none',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    {!isCompleted && <GripVertical size={13} style={{ color: '#9CA3AF' }} />}
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
                      {player.jerseyNumber || 'â€¢'}
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

                    <span
                      className="ovr-pill-badge"
                      style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}
                      title={`Overall Score: ${calcOverall(player)}`}
                    >
                      OVR {calcOverall(player)}
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

                    {!isCompleted && player.isGuest && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGuestPlayer(player.id);
                        }}
                        title="Remove Guest"
                        style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', border: 'none', background: 'none' }}
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
                onClick={() => {
                  setEditingTeamIdx(null);
                  setIsTeamModalOpen(true);
                }}
              >
                <Plus size={14} />
                <span>Create First Team</span>
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
              const teamPlayerList = getSortedPlayerList(team);
              const isDragTarget = dragOverTarget === teamIdx;
              const themeColor = PRESET_TEAM_COLORS[teamIdx % PRESET_TEAM_COLORS.length];
              const avgScore = teamPlayerList.length > 0
                ? Math.round(teamPlayerList.reduce((acc, p) => acc + calcOverall(p), 0) / teamPlayerList.length)
                : 0;

              return (
                <div
                  key={team.name ? `${team.name}-${teamIdx}` : teamIdx}
                  onDragOver={isCompleted ? undefined : (e) => handleDragOver(e, teamIdx)}
                  onDragLeave={isCompleted ? undefined : (e) => handleDragLeave(e, teamIdx)}
                  onDrop={isCompleted ? undefined : (e) => handleDrop(e, teamIdx)}
                  style={{
                    backgroundColor: !isCompleted && isDragTarget ? '#ECFDF5' : '#fff',
                    borderRadius: '16px',
                    border: !isCompleted && isDragTarget ? '2px dashed #059669' : '1px solid var(--border-subtle)',
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
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '12px'
                  }}>
                    {/* Main Header Row: Team Icon + Name & Meta + Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        {/* Prominent Team Crest / Icon */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: team.color || themeColor.bg,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 800,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
                          border: '2px solid rgba(255,255,255,0.25)',
                          flexShrink: 0
                        }}>
                          {team.name ? team.name.charAt(0).toUpperCase() : String.fromCharCode(65 + teamIdx)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {team.name}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '4px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {teamPlayerList.length} {teamPlayerList.length === 1 ? 'Player' : 'Players'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span
                          style={{
                            color: 'rgb(0,59,27)',
                            fontWeight: 700,
                            fontSize: '13px',
                            marginRight: !isCompleted ? '4px' : '0',
                            letterSpacing: '-0.2px'
                          }}
                          title="Team Average Score"
                        >
                          Avg: {teamPlayerList.length > 0 ? avgScore : '--'}
                        </span>

                        {!isCompleted && (
                          <>
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
                                padding: '6px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
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
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTeam(teamIdx)}
                              title={`Delete ${team.name}`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#9CA3AF',
                                padding: '6px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
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
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Sub-bar with Sort Control and Lineup Hint */}
                    {!isCompleted && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        paddingTop: '6px',
                        borderTop: '1px dashed var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {team.sortBy === 'manual' || !team.sortBy
                            ? 'Drag players to reorder'
                            : `Sorted by ${team.sortBy === 'stats' ? 'Overall Rating' : 'Position'}`}
                        </span>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <label
                            htmlFor={`team-sort-match-${teamIdx}`}
                            style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}
                          >
                            Sort:
                          </label>
                          <select
                            id={`team-sort-match-${teamIdx}`}
                            aria-label={`Sort players in ${team.name}`}
                            value={team.sortBy || 'manual'}
                            onChange={(e) => handleTeamSortChange(teamIdx, e.target.value)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: '#fff',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                            title="Sort within team: Manual, Position, or Stats"
                          >
                            <option value="manual">Manual</option>
                            <option value="position">Position</option>
                            <option value="stats">Stats (OVR)</option>
                          </select>
                        </div>
                      </div>
                    )}
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
                      {isCompleted ? `No players assigned to ${team.name}` : `Drop players here to assign to ${team.name}`}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {teamPlayerList.map((player) => {
                        const isSelected = !isCompleted && selectedPlayerToSwap?.playerId === player.id;
                        const isDragging = !isCompleted && draggingPlayer?.playerId === player.id;
                        const isDropTargetPlayer = !isCompleted && dragOverPlayerId === player.id && draggingPlayer?.playerId !== player.id;

                        return (
                          <div
                            key={player.id}
                            draggable={!isCompleted}
                            onDragStart={isCompleted ? undefined : (e) => handleDragStart(e, player.id, teamIdx)}
                            onDragEnd={isCompleted ? undefined : handleDragEnd}
                            onDragOver={isCompleted ? undefined : (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (dragOverPlayerId !== player.id) {
                                setDragOverPlayerId(player.id);
                              }
                            }}
                            onDragLeave={isCompleted ? undefined : (e) => {
                              if (dragOverPlayerId === player.id) {
                                setDragOverPlayerId(null);
                              }
                            }}
                            onDrop={isCompleted ? undefined : (e) => {
                              setDragOverPlayerId(null);
                              handleDropOnPlayer(e, player.id, teamIdx);
                            }}
                            onClick={isCompleted ? undefined : () => handlePlayerClick(player.id, teamIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#EFF6FF' : (isDropTargetPlayer ? '#ECFDF5' : 'var(--bg-subtle)'),
                              border: isSelected ? '1px solid #3B82F6' : (isDropTargetPlayer ? '1px dashed #059669' : '1px solid transparent'),
                              cursor: isCompleted ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                              opacity: isDragging ? 0.35 : 1,
                              userSelect: 'none',
                              transition: 'all 0.12s ease',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              {!isCompleted && <GripVertical size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />}
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
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {player.jerseyNumber || '•'}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {/* Player Overall Score */}
                              <span
                                className="ovr-pill-badge"
                                style={{ fontSize: '10.5px', padding: '2px 7px' }}
                                title={`Overall Score: ${calcOverall(player)}`}
                              >
                                OVR {calcOverall(player)}
                              </span>

                              {!isCompleted && player.isGuest && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGuestPlayer(player.id);
                                  }}
                                  title="Remove Guest"
                                  style={{ color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', border: 'none', background: 'none', padding: '2px' }}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
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

      {/* Team Create/Edit Modal */}
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

      {/* Add Guest Player Modal */}
      <GuestPlayerModal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        teams={teams}
        onSave={handleAddGuestPlayer}
      />

      {/* Edit Match Modal */}
      {!isCompleted && (
        <MatchFormModal
          isOpen={isEditModalOpen}
          matchToEdit={match}
          onClose={() => setIsEditModalOpen(false)}
          onMatchSaved={() => {
            loadMatchData();
            showToast('Match fixture details updated.');
          }}
        />
      )}

      {/* Complete Match Modal (Score entry) */}
      {isScoreModalOpen && (
        <div className="modal-overlay-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content-card" style={{ maxWidth: '400px' }}>
            <h2 className="modal-heading" style={{ marginBottom: '8px' }}>Log Final Match Score</h2>
            <p className="modal-description">
              {recordedGoals.home + recordedGoals.away > 0
                ? 'Score is pre-filled from the goals recorded in Match Activity. You can adjust it before confirming.'
                : 'Enter final result to mark fixture completed.'}
            </p>

            <form onSubmit={handleCompleteMatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
                <div className="rating-input-field">
                  <label className="rating-field-label">{teams[0]?.name || 'Home / Team A'}</label>
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
                  <label className="rating-field-label">{teams[1]?.name || 'Away / Team B'}</label>
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

      {/* Record Activity Modal (goal / foul) */}
      {isActivityOpen && (
        <RecordActivityModal
          isOpen={isActivityOpen}
          match={match}
          players={[...squadPlayers, ...guestPlayers.map((g) => ({ ...g, isGuest: true }))]}
          teams={teams}
          onClose={() => setIsActivityOpen(false)}
          onSave={handleSaveActivity}
        />
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