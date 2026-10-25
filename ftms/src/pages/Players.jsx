import { useState, useEffect, useTransition, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Activity,
  HeartPulse,
  Award,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { playerService, calcOverall } from '../services/playerService';
import PlayerFormModal from '../components/players/PlayerFormModal';

export default function Players() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const urlPos = searchParams.get('position') || '';

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState(urlPos);
  const [sortBy, setSortBy] = useState('name');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.title = 'Squad Roster | Team Manager';
    return () => {
      document.title = 'Team Manager | Sunday Squad Notebook';
    };
  }, []);

  useEffect(() => {
    if (urlPos !== positionFilter) {
      setPositionFilter(urlPos);
    }
  }, [urlPos]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerService.search(searchQuery, positionFilter, sortBy);
      startTransition(() => {
        setPlayers(data);
      });
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, positionFilter, sortBy]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Squad Summary Metrics
  const squadStats = useMemo(() => {
    const total = players.length;
    const active = players.filter((p) => p.status === 'active').length;
    const injured = players.filter((p) => p.status === 'injured').length;
    const inactive = players.filter((p) => p.status === 'inactive').length;
    const avgOvr = total > 0 
      ? Math.round(players.reduce((acc, p) => acc + calcOverall(p), 0) / total)
      : 0;
    return { total, active, injured, inactive, avgOvr };
  }, [players]);

  const getStatusBadge = (status) => {
    if (status === 'injured') {
      return (
        <span className="badge badge-peach" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>
          Injured
        </span>
      );
    }
    if (status === 'inactive') {
      return (
        <span className="badge badge-peach" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 600 }}>
          Inactive
        </span>
      );
    }
    return (
      <span className="badge badge-green" style={{ fontWeight: 600 }}>
        Active
      </span>
    );
  };

  const getPositionBadgeClass = (pos) => {
    switch (pos) {
      case 'GK': return 'badge-gk';
      case 'DEF': return 'badge-def';
      case 'MID': return 'badge-mid';
      case 'FWD': return 'badge-att';
      default: return 'badge-mid';
    }
  };

  const handlePositionFilterChange = (newPos) => {
    setPositionFilter(newPos);
    if (newPos) {
      setSearchParams({ position: newPos });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="players-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Header Card */}
      <section className="welcome-hero-card" style={{ padding: '24px 28px' }}>
        <div className="hero-header-row" style={{ marginBottom: '16px' }}>
          <div className="hero-title-group">
            <h1 className="hero-title" style={{ fontSize: '28px' }}>Squad Roster</h1>
            <p className="hero-subtitle">
              Manage player dossiers, position depth, tactical attributes, and squad readiness.
            </p>
          </div>
          
          <button
            type="button"
            className="btn-import-backup"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} />
            <span>Add Player</span>
          </button>
        </div>

        {/* Quick Filter & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or jersey #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#fff',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* Position Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={positionFilter}
              onChange={(e) => handlePositionFilterChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#fff',
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="">All Positions</option>
              <option value="GK">Goalkeepers (GK)</option>
              <option value="DEF">Defenders (DEF)</option>
              <option value="MID">Midfielders (MID)</option>
              <option value="FWD">Forwards (FWD)</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#fff',
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="jerseyNumber">Sort by Jersey #</option>
              <option value="rating">Sort by Rating (OVR)</option>
              <option value="age">Sort by Age</option>
              <option value="position">Sort by Position</option>
            </select>
          </div>
        </div>

        {/* Squad Summary Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest-green)' }}>
              <Users size={16} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Roster Size</span>
              <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{squadStats.total} Players</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Active Ready</span>
              <strong style={{ fontSize: '15px', color: '#047857' }}>{squadStats.active}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C' }}>
              <HeartPulse size={16} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Injured/Away</span>
              <strong style={{ fontSize: '15px', color: '#B91C1C' }}>{squadStats.injured + squadStats.inactive}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <Award size={16} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Squad Avg OVR</span>
              <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{squadStats.avgOvr}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Players List Grid / Table with Rich Useful Information */}
      <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading squad roster...
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="empty-state-icon-circle action-sand" style={{ width: '56px', height: '56px', marginBottom: '14px' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No players found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '20px' }}>
              {searchQuery || positionFilter
                ? 'No squad members matched your current filters. Try resetting search.'
                : 'Your squad roster is empty. Register your first player to get started.'}
            </p>
            <button
              type="button"
              className="btn-import-backup"
              onClick={() => setIsAddModalOpen(true)}
            >
              <UserPlus size={15} />
              <span>Register First Player</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Table Header: Only Player Name, Pos, OVR, Status */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 110px 110px 130px',
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              alignItems: 'center'
            }}>
              <span>Player Name</span>
              <span>Pos</span>
              <span style={{ textAlign: 'center' }}>OVR</span>
              <span>Status</span>
            </div>

            {/* Player Rows: Only Player Name, Pos, OVR, Status */}
            {players.map((player) => {
              const ovr = calcOverall(player);

              return (
                <div
                  key={player.id}
                  onClick={() => navigate(`/players/${player.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 110px 110px 130px',
                    padding: '14px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF7F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Player Name */}
                  <div>
                    <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)', display: 'block' }}>
                      {player.name}
                    </strong>
                  </div>

                  {/* Position */}
                  <div>
                    <span className={`position-badge ${getPositionBadgeClass(player.position)}`} style={{ display: 'inline-block' }}>
                      {player.position}
                    </span>
                  </div>

                  {/* Overall Rating */}
                  <div style={{ textAlign: 'center' }}>
                    <span className="ovr-pill-badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
                      {ovr}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    {getStatusBadge(player.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Player Modal */}
      <PlayerFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPlayerSaved={() => {
          loadPlayers();
          showToast('Player registered to squad notebook.');
        }}
      />
    </div>
  );
}
