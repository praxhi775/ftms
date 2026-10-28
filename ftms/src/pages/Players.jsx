import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
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
import PlayerContextMenu from '../components/players/PlayerContextMenu';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Players() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const urlPos = searchParams.get('position') || '';
  const urlStatus = searchParams.get('status') || '';

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState(urlPos);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [sortBy, setSortBy] = useState('name');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Right-click menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, player }
  const [playerToEdit, setPlayerToEdit] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

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

  useEffect(() => {
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

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

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;
    try {
      await playerService.remove(playerToDelete.id);
      showToast(`${playerToDelete.name} removed from squad.`);
      setPlayerToDelete(null);
      loadPlayers();
    } catch (err) {
      showToast(err.message || 'Failed to delete player');
      setPlayerToDelete(null);
    }
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

  const visiblePlayers = useMemo(
    () => (statusFilter ? players.filter((p) => p.status === statusFilter) : players),
    [players, statusFilter]
  );

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

  const updateFilterParams = (pos, status) => {
    const params = {};
    if (pos) params.position = pos;
    if (status) params.status = status;
    setSearchParams(params);
  };

  const handlePositionFilterChange = (newPos) => {
    setPositionFilter(newPos);
    updateFilterParams(newPos, statusFilter);
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    updateFilterParams(positionFilter, newStatus);
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

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              aria-label="Filter by status"
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
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="injured">Injured</option>
              <option value="inactive">Inactive</option>
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
        ) : visiblePlayers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="empty-state-icon-circle action-sand" style={{ width: '56px', height: '56px', marginBottom: '14px' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No players found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '20px' }}>
              {searchQuery || positionFilter || statusFilter
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
              <span style={{ textAlign: 'center' }}>Pos</span>
              <span style={{ textAlign: 'center' }}>OVR</span>
              <span>Status</span>
            </div>

            {/* Player Rows: Only Player Name, Pos, OVR, Status */}
            {visiblePlayers.map((player) => {
              const ovr = calcOverall(player);

              return (
                <div
                  key={player.id}
                  onClick={() => navigate(`/players/${player.id}`)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, player });
                  }}
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
                  <div style={{ textAlign: 'center' }}>
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

      {/* Right-click menu */}
      <PlayerContextMenu
        menu={contextMenu}
        onClose={closeContextMenu}
        onView={(p) => navigate(`/players/${p.id}`)}
        onEdit={(p) => setPlayerToEdit(p)}
        onDelete={(p) => setPlayerToDelete(p)}
      />

      {/* Edit Player Modal (opened from the right-click menu) */}
      <PlayerFormModal
        isOpen={!!playerToEdit}
        playerToEdit={playerToEdit}
        onClose={() => setPlayerToEdit(null)}
        onPlayerSaved={() => {
          loadPlayers();
          showToast('Player profile updated.');
        }}
      />

      {/* Delete confirmation (opened from the right-click menu) */}
      <ConfirmDialog
        isOpen={!!playerToDelete}
        title="Delete Player Dossier"
        message={playerToDelete ? `Are you sure you want to remove ${playerToDelete.name} (#${playerToDelete.jerseyNumber}) from your squad? Historical match records will preserve their presence.` : ''}
        confirmLabel="Delete Player"
        confirmVariant="danger"
        onCancel={() => setPlayerToDelete(null)}
        onConfirm={handleDeletePlayer}
      />

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