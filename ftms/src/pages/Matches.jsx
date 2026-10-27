import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  ChevronRight, 
  CheckCircle2,
  Trash2 
} from 'lucide-react';
import { matchService } from '../services/matchService';
import MatchFormModal from '../components/matches/MatchFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Matches() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed'
  const [loading, setLoading] = useState(true);
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      if (activeTab === 'upcoming') {
        const data = await matchService.getUpcoming();
        setMatches(data);
      } else {
        const data = await matchService.getCompleted();
        setMatches(data);
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!matchToDelete) return;
    if (matchToDelete.status === 'completed') {
      showToast('Completed matches cannot be deleted.');
      setIsDeleteModalOpen(false);
      setMatchToDelete(null);
      return;
    }
    try {
      await matchService.remove(matchToDelete.id);
      showToast(`Match "${matchToDelete.title}" deleted.`);
      loadMatches();
    } catch (err) {
      console.error('Failed to delete match:', err);
      showToast(err.message || 'Failed to delete match');
    } finally {
      setIsDeleteModalOpen(false);
      setMatchToDelete(null);
    }
  };

  return (
    <div className="matches-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="welcome-hero-card" style={{ padding: '24px 28px' }}>
        <div className="hero-header-row" style={{ marginBottom: '16px' }}>
          <div className="hero-title-group">
            <h1 className="hero-title" style={{ fontSize: '28px' }}>Matches &amp; Scrimmages</h1>
            <p className="hero-subtitle">
              Schedule matchdays, generate balanced tactical teams, and log match outcomes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-dossier-action"
              onClick={() => navigate('/teams')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff' }}
            >
              <Users size={15} />
              <span>Team Builder</span>
            </button>
            <button
              type="button"
              className="btn-import-backup"
              onClick={() => setIsNewMatchOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>New Match</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'upcoming' ? 'var(--forest-green)' : '#fff',
              color: activeTab === 'upcoming' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (activeTab === 'upcoming' ? 'var(--forest-green)' : 'var(--border-subtle)'),
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Upcoming Matches
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'completed' ? 'var(--forest-green)' : '#fff',
              color: activeTab === 'completed' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (activeTab === 'completed' ? 'var(--forest-green)' : 'var(--border-subtle)'),
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Completed Fixtures
          </button>
        </div>
      </section>

      {/* Matches Grid */}
      <section>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading match ledger...
          </div>
        ) : matches.length === 0 ? (
          <div className="placeholder-content-card" style={{ textAlign: 'center' }}>
            <div className="empty-state-icon-circle action-sand" style={{ margin: '0 auto 16px' }}>
              <Trophy size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {activeTab === 'upcoming' ? 'No Upcoming Matches Scheduled' : 'No Completed Fixtures Yet'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
              {activeTab === 'upcoming'
                ? 'Pencil in your next training session or Sunday scrimmage to hand-pick available squads and generate balanced teams.'
                : 'Completed matches and final scores will appear here once marked finished.'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                type="button"
                className="btn-import-backup"
                onClick={() => setIsNewMatchOpen(true)}
              >
                <Plus size={15} />
                <span>Schedule First Match</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {matches.map((match) => {
              const squadCount = match.selectedPlayerIds?.length || 0;
              const hasTeams = match.teams && match.teams.length > 0;

              return (
                <div
                  key={match.id}
                  onClick={() => navigate(`/matches/${match.id}`)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                    e.currentTarget.style.borderColor = '#D6D0C3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${match.status === 'completed' ? 'badge-green' : 'badge-peach'}`}>
                        {match.status === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {match.matchType || 'Friendly'}
                      </span>
                    </div>

                    {match.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMatchToDelete(match);
                          setIsDeleteModalOpen(true);
                        }}
                        title={`Delete ${match.title}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          padding: '5px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#DC2626';
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {match.title}
                    </h3>
                  </div>

                  {/* Score if completed */}
                  {match.status === 'completed' && match.score && (
                    <div style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Final Score:</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--forest-green)' }}>
                        {match.score.home} - {match.score.away}
                      </span>
                    </div>
                  )}

                  {/* Meta details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{match.date} {match.time ? `at ${match.time}` : ''}</span>
                    </div>
                    {match.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{match.venue}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{squadCount} Squad Players Selected</span>
                    </div>
                  </div>

                  {/* Footer status */}
                  <div style={{
                    marginTop: 'auto',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: hasTeams ? 'var(--forest-green)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {hasTeams && <CheckCircle2 size={12} />}
                      {hasTeams ? `${match.teams.length} Teams Configured` : 'Teams Not Generated Yet'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--forest-green)' }}>
                      <span>View Match</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* New Match Modal */}
      <MatchFormModal
        isOpen={isNewMatchOpen}
        onClose={() => setIsNewMatchOpen(false)}
        onMatchSaved={() => {
          loadMatches();
          showToast('Match fixture scheduled.');
        }}
      />

      {/* Delete Match Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title={matchToDelete?.status === 'completed' ? 'Delete Completed Match' : 'Delete Match Fixture'}
        message={`Are you sure you want to delete "${matchToDelete?.title}"? All associated match scores, player stats, and squad lineups will be permanently deleted.`}
        confirmLabel="Delete Match"
        confirmVariant="danger"
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setMatchToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}