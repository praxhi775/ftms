import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  SlidersHorizontal, 
  Calendar, 
  Trophy, 
  Award,
  ChevronRight 
} from 'lucide-react';
import { playerService, calcOverall } from '../services/playerService';
import { matchService } from '../services/matchService';
import { statsService } from '../services/statsService';
import AttributeRadarChart from '../components/dossier/AttributeRadarChart';
import PlayerTraitsPanel from '../components/dossier/PlayerTraitsPanel';
import SubMetricBreakdown from '../components/dossier/SubMetricBreakdown';
import EditRatingsModal from '../components/dossier/EditRatingsModal';
import PlayerFormModal from '../components/players/PlayerFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerMatches, setPlayerMatches] = useState([]);
  const [playerStatsSummary, setPlayerStatsSummary] = useState({});

  const [isEditRatingsOpen, setIsEditRatingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      const playerId = Number(id);
      const data = await playerService.getById(playerId);
      if (!data) {
        setError('Player dossier not found.');
        return;
      }
      setPlayer(data);

      // Load player's match history
      const allMatches = await matchService.getAll();
      const attended = allMatches.filter((m) => 
        m.selectedPlayerIds && m.selectedPlayerIds.includes(playerId)
      );
      setPlayerMatches(attended);

      // Load recorded stats summary
      const statsSummary = await statsService.getPlayerStatsSummary(playerId);
      setPlayerStatsSummary(statsSummary);
    } catch (err) {
      console.error('Failed to load player dossier:', err);
      setError('An error occurred while loading player dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const ovrRating = useMemo(() => {
    if (!player || !player.ratings) return 50;
    return calcOverall(player.ratings);
  }, [player]);

  const handleUpdateRatings = async (newRatings) => {
    try {
      await playerService.update(player.id, { ratings: newRatings });
      setPlayer((prev) => ({ ...prev, ratings: newRatings }));
      showToast('Tactical attribute ratings updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update ratings');
    }
  };

  const handleDeletePlayer = async () => {
    try {
      await playerService.remove(player.id);
      navigate('/players');
    } catch (err) {
      showToast(err.message || 'Failed to delete player');
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading player dossier...
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="placeholder-page-container">
        <div className="placeholder-content-card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>{error || 'Player Not Found'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            The requested player dossier does not exist in local storage.
          </p>
          <Link to="/players" className="btn-directive" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Squad Roster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="player-dossier-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Action Bar */}
      <header className="dossier-header-bar">
        <nav className="dossier-breadcrumb" aria-label="Breadcrumb">
          <Link to="/players" className="breadcrumb-root" style={{ color: 'var(--forest-green)', textDecoration: 'none' }}>
            SQUAD ROSTER
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-sub">{player.position}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">#{player.jerseyNumber} {player.name}</span>
        </nav>

        <div className="dossier-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-dossier-action btn-export-sheet"
            onClick={() => setIsEditProfileOpen(true)}
            aria-label="Edit Profile"
          >
            <Edit3 size={15} strokeWidth={2.2} />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            className="btn-dossier-action btn-edit-ratings"
            onClick={() => setIsEditRatingsOpen(true)}
            aria-label="Edit Primary Ratings"
          >
            <SlidersHorizontal size={15} strokeWidth={2.2} />
            <span>Edit Ratings</span>
          </button>

          <button
            type="button"
            className="btn-dossier-action"
            onClick={() => setIsDeleteDialogOpen(true)}
            style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            aria-label="Delete Player"
          >
            <Trash2 size={15} strokeWidth={2.2} />
            <span>Delete</span>
          </button>
        </div>
      </header>

      {/* Main Player Profile Card */}
      <section className="player-profile-main-card" aria-label="Player Profile Dossier">
        <div className="profile-identity-header">
          <div className="squad-number-badge-wrap">
            <div className="squad-number-circle" aria-label={`Squad Number ${player.jerseyNumber}`}>
              {player.jerseyNumber}
            </div>
            <div className="position-subbadge" aria-label={`Position ${player.position}`}>
              {player.position}
            </div>
          </div>

          <div className="profile-name-group">
            <div className="name-and-ovr-row">
              <h1 className="player-full-name">{player.name}</h1>
              <span className="ovr-pill-badge" aria-label={`Overall Rating ${ovrRating}`}>
                OVR {ovrRating}
              </span>
            </div>

            <div className="player-meta-inline">
              <span className="meta-position-tag">
                {player.position} • {player.preferredFoot || 'Right'} Foot
              </span>
              {player.age && (
                <>
                  <span className="meta-bullet">•</span>
                  <span>Age {player.age}</span>
                </>
              )}
              {player.height && (
                <>
                  <span className="meta-bullet">•</span>
                  <span>{player.height} cm</span>
                </>
              )}
              {player.weight && (
                <>
                  <span className="meta-bullet">•</span>
                  <span>{player.weight} kg</span>
                </>
              )}
              <span className="meta-bullet">•</span>
              <span style={{ textTransform: 'capitalize' }}>Status: {player.status || 'Active'}</span>
            </div>

            {player.notes && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{player.notes}"
              </p>
            )}
          </div>
        </div>

        {/* Profile Body: Radar Chart & Trait Stack */}
        <div className="profile-body-grid">
          <div className="profile-radar-col">
            <AttributeRadarChart ratings={player.ratings || { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 }} />
          </div>

          <div className="profile-traits-col">
            <PlayerTraitsPanel />
          </div>
        </div>
      </section>

      {/* SubMetric Breakdown */}
      <SubMetricBreakdown />

      {/* Match History & Recorded Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Match Participation Card */}
        <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '22px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={18} style={{ color: 'var(--forest-green)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Match Call-ups ({playerMatches.length})
            </h3>
          </div>

          {playerMatches.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              No matches logged for this player yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playerMatches.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  onClick={() => navigate(`/matches/${match.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF7F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                      {match.title}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {match.date} • {match.venue || 'Pitch'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${match.status === 'completed' ? 'badge-green' : 'badge-peach'}`} style={{ fontSize: '10px' }}>
                      {match.status}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recorded Statistics Card */}
        <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '22px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Trophy size={18} style={{ color: 'var(--forest-green)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recorded Performance Ledger
            </h3>
          </div>

          {Object.keys(playerStatsSummary).length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              No custom statistics recorded for this player yet. Stats are logged after completed matches.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(playerStatsSummary).map(([name, item]) => {
                const isQuantitative = item.def.type === 'quantitative';
                const totalOrAvg = isQuantitative
                  ? `${item.values.reduce((sum, v) => sum + (Number(v.value) || 0), 0)} ${item.def.unit || ''}`.trim()
                  : `${item.values.length} entries`;

                return (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-subtle)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                        {item.values.length} recorded match appearances
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={14} style={{ color: 'var(--forest-green)' }} />
                      <strong style={{ fontSize: '14px', fontFamily: 'var(--font-heading)' }}>
                        {totalOrAvg}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Ratings Modal */}
      {isEditRatingsOpen && (
        <EditRatingsModal
          initialRatings={player.ratings || { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 }}
          onClose={() => setIsEditRatingsOpen(false)}
          onUpdateRatings={handleUpdateRatings}
        />
      )}

      {/* Edit Profile Modal */}
      <PlayerFormModal
        isOpen={isEditProfileOpen}
        playerToEdit={player}
        onClose={() => setIsEditProfileOpen(false)}
        onPlayerSaved={() => {
          loadPlayerData();
          showToast('Player profile updated.');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Player Dossier"
        message={`Are you sure you want to remove ${player.name} (#${player.jerseyNumber}) from your squad? Historical match records will preserve their presence.`}
        confirmLabel="Delete Player"
        confirmVariant="danger"
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeletePlayer}
      />
    </div>
  );
}
