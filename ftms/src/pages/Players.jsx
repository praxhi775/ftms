import { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { playerService, calcOverall } from '../services/playerService';
import PlayerFormModal from '../components/players/PlayerFormModal';

export default function Players() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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

  const getStatusBadge = (status) => {
    if (status === 'injured') {
      return <span className="badge badge-peach" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>Injured</span>;
    }
    if (status === 'inactive') {
      return <span className="badge badge-peach" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>Inactive</span>;
    }
    return <span className="badge badge-green">Active</span>;
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
              onChange={(e) => setPositionFilter(e.target.value)}
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
            </select>
          </div>
        </div>
      </section>

      {/* Players List Grid / Table */}
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '70px 2fr 100px 100px 120px 80px 40px',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>#</span>
              <span>Player Name</span>
              <span>Position</span>
              <span>OVR Rating</span>
              <span>Status</span>
              <span>Foot</span>
              <span></span>
            </div>

            {players.map((player) => {
              const ovr = calcOverall(player.ratings);
              return (
                <div
                  key={player.id}
                  onClick={() => navigate(`/players/${player.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 2fr 100px 100px 120px 80px 40px',
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF7F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--pale-green-bg)',
                    color: 'var(--forest-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    {player.jerseyNumber}
                  </div>

                  <div>
                    <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)', display: 'block' }}>
                      {player.name}
                    </strong>
                    {player.notes && (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                        {player.notes}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className={`position-badge ${getPositionBadgeClass(player.position)}`} style={{ display: 'inline-block' }}>
                      {player.position}
                    </span>
                  </div>

                  <div>
                    <span className="ovr-pill-badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
                      {ovr}
                    </span>
                  </div>

                  <div>
                    {getStatusBadge(player.status)}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {player.preferredFoot || 'Right'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                    <ChevronRight size={16} />
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
