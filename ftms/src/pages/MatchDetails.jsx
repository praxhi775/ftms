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
  ArrowLeftRight 
} from 'lucide-react';
import { matchService } from '../services/matchService';
import { playerService } from '../services/playerService';
import { statsService } from '../services/statsService';
import { generateTeams, movePlayer, swapPlayers } from '../services/teamService';
import MatchFormModal from '../components/matches/MatchFormModal';
import RecordStatsModal from '../components/matches/RecordStatsModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Teams configuration
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState([]);

  // Swap / Move state
  const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState(null); // { playerId, teamIndex }

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordStatsOpen, setIsRecordStatsOpen] = useState(false);
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

  // Handle Team Generation
  const handleGenerateTeams = async () => {
    if (squadPlayers.length === 0) {
      showToast('No players selected for this match.');
      return;
    }

    const playerIds = squadPlayers.map((p) => p.id);
    const generated = generateTeams(playerIds, numTeams);
    setTeams(generated);
    setSelectedPlayerToSwap(null);

    // Persist generated teams to match
    await matchService.saveTeams(match.id, generated);
    setMatch((prev) => ({ ...prev, teams: generated }));
    showToast(`${numTeams} balanced teams generated & saved.`);
  };

  // Handle Player Swap / Move
  const handlePlayerClick = async (playerId, teamIndex) => {
    if (!selectedPlayerToSwap) {
      // Select first player
      setSelectedPlayerToSwap({ playerId, teamIndex });
      showToast('Player selected. Click another player to SWAP or an arrow to MOVE.');
    } else {
      // Swap with second player
      if (selectedPlayerToSwap.teamIndex === teamIndex && selectedPlayerToSwap.playerId === playerId) {
        // Deselect
        setSelectedPlayerToSwap(null);
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
      await matchService.saveTeams(match.id, newTeams);
      showToast('Players swapped successfully.');
    }
  };

  const handleMovePlayerToTeam = async (playerId, fromTeamIdx, toTeamIdx) => {
    const newTeams = movePlayer(teams, playerId, fromTeamIdx, toTeamIdx);
    setTeams(newTeams);
    setSelectedPlayerToSwap(null);
    await matchService.saveTeams(match.id, newTeams);
    showToast(`Player moved to ${newTeams[toTeamIdx].name}.`);
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

  const playerMap = {};
  squadPlayers.forEach((p) => {
    playerMap[p.id] = p;
  });

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
          <Link to="/matches" className="breadcrumb-root" style={{ color: 'var(--forest-green)', textDecoration: 'none' }}>
            MATCHES
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
            <span>{squadPlayers.length} Matchday Squad Members</span>
          </div>
        </div>

        {match.notes && (
          <p style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '8px' }}>
            Note: {match.notes}
          </p>
        )}
      </section>

      {/* Team Generator Controls Card */}
      <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Random Team Generator
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Randomly distribute selected available players into balanced squads with even surplus distribution.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Teams:
              </label>
              <select
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: '#fff',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              >
                <option value={2}>2 Teams</option>
                <option value={3}>3 Teams</option>
                <option value={4}>4 Teams</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-import-backup"
              onClick={handleGenerateTeams}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Shuffle size={14} />
              <span>{teams.length > 0 ? 'Shuffle & Regenerate' : 'Generate Teams'}</span>
            </button>
          </div>
        </div>

        {selectedPlayerToSwap && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
            color: '#1E40AF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeftRight size={15} />
              <span>
                Selected <strong>{playerMap[selectedPlayerToSwap.playerId]?.name}</strong> ({teams[selectedPlayerToSwap.teamIndex]?.name}). Click another player to swap.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlayerToSwap(null)}
              style={{ fontSize: '11px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Generated Teams Grid */}
      {teams.length === 0 ? (
        <section className="placeholder-content-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="empty-state-icon-circle action-sand" style={{ margin: '0 auto 12px' }}>
            <Users size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Teams Not Yet Generated
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px' }}>
            Click "Generate Teams" above to split the {squadPlayers.length} selected players randomly.
          </p>
        </section>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: `repeat(${teams.length}, 1fr)`, gap: '16px' }}>
          {teams.map((team, teamIdx) => {
            const teamPlayerList = team.playerIds.map((pid) => playerMap[pid]).filter(Boolean);

            return (
              <div
                key={team.name || teamIdx}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Team Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {team.name}
                    </h3>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {teamPlayerList.length} Players Assigned
                    </span>
                  </div>
                  <span className={`badge ${teamIdx === 0 ? 'badge-green' : 'badge-peach'}`}>
                    Team {String.fromCharCode(65 + teamIdx)}
                  </span>
                </div>

                {/* Team Roster with Swap/Move capabilities */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {teamPlayerList.map((player) => {
                    const isSelected = selectedPlayerToSwap?.playerId === player.id;

                    return (
                      <div
                        key={player.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#EFF6FF' : 'var(--bg-subtle)',
                          border: isSelected ? '1px solid #3B82F6' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => handlePlayerClick(player.id, teamIdx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--pale-green-bg)',
                            color: 'var(--forest-green)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {player.jerseyNumber}
                          </span>
                          <div>
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                              {player.name}
                            </strong>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {player.position}
                            </span>
                          </div>
                        </div>

                        {/* Move Buttons */}
                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          {teams.map((otherTeam, otherIdx) => {
                            if (otherIdx === teamIdx) return null;
                            return (
                              <button
                                key={otherIdx}
                                type="button"
                                title={`Move to ${otherTeam.name}`}
                                onClick={() => handleMovePlayerToTeam(player.id, teamIdx, otherIdx)}
                                style={{
                                  padding: '3px 6px',
                                  fontSize: '10px',
                                  borderRadius: '4px',
                                  backgroundColor: '#fff',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                              >
                                <span>To T{String.fromCharCode(65 + otherIdx)}</span>
                                <MoveRight size={10} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

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
          players={squadPlayers}
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
