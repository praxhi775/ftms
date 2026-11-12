import { useEffect, useMemo, useState } from 'react';
import { LogOut, ShieldOff, ShieldPlus, Search, Users } from 'lucide-react';
import AppLogo from '../../components/common/AppLogo';
import { friendlyAuthError } from '../../firebase/authErrors';
import { useAuth } from '../../context/useAuth';
import {
  MANAGER_STATUS,
  subscribeToManagers,
  setManagerStatus,
} from '../../services/adminService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const formatDate = (value) => {
  const date = value?.toDate ? value.toDate() : null;
  return date ? date.toLocaleString() : '—';
};

export default function AdminHome() {
  const { user, logout } = useAuth();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pending, setPending] = useState(null); // manager waiting for confirmation
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    document.title = 'Admin | FTMS';
    const unsubscribe = subscribeToManagers(
      (list) => {
        setManagers(list);
        setError('');
        setLoading(false);
      },
      (err) => {
        setError(friendlyAuthError(err));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const counts = useMemo(
    () => ({
      total: managers.length,
      active: managers.filter((m) => m.status !== MANAGER_STATUS.BLOCKED).length,
      blocked: managers.filter((m) => m.status === MANAGER_STATUS.BLOCKED).length,
    }),
    [managers]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return managers.filter((m) => {
      const isBlocked = m.status === MANAGER_STATUS.BLOCKED;
      if (statusFilter === 'active' && isBlocked) return false;
      if (statusFilter === 'blocked' && !isBlocked) return false;
      if (!q) return true;
      return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    });
  }, [managers, search, statusFilter]);

  const confirmChange = async () => {
    if (!pending) return;
    const { manager, nextStatus } = pending;
    setPending(null);
    setBusyId(manager.id);
    try {
      await setManagerStatus(manager.id, nextStatus, user.uid);
      showToast(
        nextStatus === MANAGER_STATUS.BLOCKED
          ? `${manager.name} has been blocked.`
          : `${manager.name} has been unblocked.`
      );
    } catch (err) {
      showToast(friendlyAuthError(err));
    } finally {
      setBusyId(null);
    }
  };

  const pendingBlocking = pending?.nextStatus === MANAGER_STATUS.BLOCKED;

  return (
    <div className="admin-page">
      {toast && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toast}</span>
        </div>
      )}

      <header className="admin-header">
        <div className="admin-title-group">
          <AppLogo size={40} alt="FTMS" />
          <div>
            <h1 className="admin-title">Admin</h1>
            <span className="admin-sub">Signed in as {user?.email}</span>
          </div>
        </div>
        <button type="button" className="auth-btn-secondary" onClick={logout}>
          <LogOut size={15} /> Log out
        </button>
      </header>

      <section className="admin-card" aria-labelledby="managers-heading">
        <div className="admin-card-head">
          <Users size={18} />
          <h2 id="managers-heading">Registered managers</h2>
        </div>

        <div className="admin-counts">
          <span className="admin-count-chip">{counts.total} total</span>
          <span className="admin-count-chip admin-count-active">{counts.active} active</span>
          <span className="admin-count-chip admin-count-blocked">{counts.blocked} blocked</span>
        </div>

        <div className="admin-toolbar">
          <div className="admin-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              aria-label="Search managers"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="admin-filter"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {loading && <p className="admin-muted">Loading managers…</p>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        {!loading && !error && managers.length === 0 && (
          <p className="admin-muted">No managers have registered yet.</p>
        )}
        {!loading && managers.length > 0 && visible.length === 0 && (
          <p className="admin-muted">No managers match your search.</p>
        )}

        {visible.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Last login</th>
                  <th>Status</th>
                  <th className="admin-th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => {
                  const isBlocked = m.status === MANAGER_STATUS.BLOCKED;
                  const isSelf = m.id === user?.uid;
                  return (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{formatDate(m.createdAt)}</td>
                      <td>{formatDate(m.lastLoginAt)}</td>
                      <td>
                        <span className={`admin-status admin-status-${isBlocked ? 'blocked' : 'active'}`}>
                          {isBlocked ? 'blocked' : 'active'}
                        </span>
                        {isBlocked && m.statusChangedAt && (
                          <span className="admin-status-since">since {formatDate(m.statusChangedAt)}</span>
                        )}
                      </td>
                      <td className="admin-td-action">
                        {!isSelf && (
                          <button
                            type="button"
                            className={isBlocked ? 'admin-btn-unblock' : 'admin-btn-block'}
                            disabled={busyId === m.id}
                            onClick={() =>
                              setPending({
                                manager: m,
                                nextStatus: isBlocked ? MANAGER_STATUS.ACTIVE : MANAGER_STATUS.BLOCKED,
                              })
                            }
                            aria-label={`${isBlocked ? 'Unblock' : 'Block'} ${m.name}`}
                          >
                            {isBlocked ? <ShieldPlus size={14} /> : <ShieldOff size={14} />}
                            {busyId === m.id ? 'Saving…' : isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="admin-muted admin-note">The activity log arrives in the next step.</p>
      </section>

      <ConfirmDialog
        isOpen={!!pending}
        title={pendingBlocking ? 'Block manager' : 'Unblock manager'}
        message={
          pending
            ? pendingBlocking
              ? `Block ${pending.manager.name} (${pending.manager.email})? They will see a "your account is blocked" message instead of the app until you unblock them.`
              : `Unblock ${pending.manager.name} (${pending.manager.email})? They will be able to use the app again.`
            : ''
        }
        confirmLabel={pendingBlocking ? 'Block' : 'Unblock'}
        confirmVariant={pendingBlocking ? 'danger' : 'primary'}
        onCancel={() => setPending(null)}
        onConfirm={confirmChange}
      />
    </div>
  );
}
