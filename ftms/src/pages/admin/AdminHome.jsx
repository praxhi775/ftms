import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LogOut, ShieldOff, ShieldPlus, Search, Users, History, RefreshCw, Filter } from 'lucide-react';
import AppLogo from '../../components/common/AppLogo';
import { friendlyAuthError } from '../../firebase/authErrors';
import { useAuth } from '../../context/useAuth';
import {
  MANAGER_STATUS,
  subscribeToManagers,
  setManagerStatus,
  fetchAllActivityLogs,
} from '../../services/adminService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatTimestamp as formatDate, formatTime, dayLabel, toDate } from '../../utils/dates';
import { ACTIVITY_CATEGORIES, categoryLabel, categoryOf } from '../../utils/activityTypes';
import { formatActivityMessage } from '../../utils/activityMessages';

// "2026-11-07" (from a date input) -> start / end of that day
const startOfInputDay = (value) => (value ? new Date(`${value}T00:00:00`) : null);
const endOfInputDay = (value) => (value ? new Date(`${value}T23:59:59.999`) : null);

export default function AdminHome() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'logs' (All Activity Logs) or 'managers' (Registered Managers)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'managers' ? 'managers' : 'logs');

  // Managers state
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [errorManagers, setErrorManagers] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pending, setPending] = useState(null); // manager waiting for confirmation
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [errorLogs, setErrorLogs] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState(() => searchParams.get('managerId') || 'all');
  const [logCategory, setLogCategory] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [logFromDate, setLogFromDate] = useState('');
  const [logToDate, setLogToDate] = useState('');

  useEffect(() => {
    document.title = activeTab === 'logs' ? 'Activity Logs | Admin FTMS' : 'Managers | Admin FTMS';
  }, [activeTab]);

  // Subscribe to live list of managers
  useEffect(() => {
    const unsubscribe = subscribeToManagers(
      (list) => {
        setManagers(list);
        setErrorManagers('');
        setLoadingManagers(false);
      },
      (err) => {
        setErrorManagers(friendlyAuthError(err));
        setLoadingManagers(false);
      }
    );
    return unsubscribe;
  }, []);

  // Fetch all logs across managers or for selected manager
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setErrorLogs('');
    try {
      const res = await fetchAllActivityLogs({
        managers,
        managerId: selectedManagerId,
        from: startOfInputDay(logFromDate),
        to: endOfInputDay(logToDate),
      });
      setLogs(res.entries);
    } catch (err) {
      setErrorLogs(friendlyAuthError(err));
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [managers, selectedManagerId, logFromDate, logToDate]);

  useEffect(() => {
    if (!loadingManagers) {
      loadLogs();
    }
  }, [loadingManagers, loadLogs]);

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

  // Filtered managers for the Managers table
  const visibleManagers = useMemo(() => {
    const q = managerSearch.trim().toLowerCase();
    return managers.filter((m) => {
      const isBlocked = m.status === MANAGER_STATUS.BLOCKED;
      if (statusFilter === 'active' && isBlocked) return false;
      if (statusFilter === 'blocked' && !isBlocked) return false;
      if (!q) return true;
      return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    });
  }, [managers, managerSearch, statusFilter]);

  // Filtered logs for the All Activity Logs list
  const visibleLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return logs.filter((e) => {
      if (logCategory !== 'all' && categoryOf(e.type) !== logCategory) return false;
      if (selectedManagerId !== 'all' && e.managerId !== selectedManagerId) return false;
      if (!q) return true;
      return (
        (e.message || '').toLowerCase().includes(q) ||
        (e.managerName || '').toLowerCase().includes(q) ||
        (e.managerEmail || '').toLowerCase().includes(q) ||
        categoryLabel(categoryOf(e.type)).toLowerCase().includes(q)
      );
    });
  }, [logs, logCategory, selectedManagerId, logSearch]);

  const anyLogFilterActive =
    selectedManagerId !== 'all' || logCategory !== 'all' || logSearch.trim() !== '' || logFromDate || logToDate;

  const clearLogFilters = () => {
    setSelectedManagerId('all');
    setLogCategory('all');
    setLogSearch('');
    setLogFromDate('');
    setLogToDate('');
  };

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
      // Reload logs to capture the block/unblock activity
      loadLogs();
    } catch (err) {
      showToast(friendlyAuthError(err));
    } finally {
      setBusyId(null);
    }
  };

  const pendingBlocking = pending?.nextStatus === MANAGER_STATUS.BLOCKED;

  // Day headings for the activity list: "Today", "Yesterday", ...
  const logRows = [];
  let lastDay = null;
  visibleLogs.forEach((e) => {
    const day = dayLabel(e.at);
    if (day !== lastDay) {
      logRows.push({ kind: 'day', key: `day-${day}-${e.id}`, label: day });
      lastDay = day;
    }
    logRows.push({ kind: 'entry', key: e.id, entry: e });
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'managers' ? { tab: 'managers' } : {});
  };

  const handleViewManagerLogs = (mgrId) => {
    setSelectedManagerId(mgrId);
    handleTabChange('logs');
  };

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
            <h1 className="admin-title">Admin Dashboard</h1>
            <span className="admin-sub">Signed in as {user?.email}</span>
          </div>
        </div>
        <button type="button" className="auth-btn-secondary" onClick={logout}>
          <LogOut size={15} /> Log out
        </button>
      </header>

      {/* Primary Tab Navigation */}
      <nav className="admin-tabs" aria-label="Admin Navigation">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => handleTabChange('logs')}
        >
          <History size={16} /> All Activity Logs ({logs.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'managers' ? 'active' : ''}`}
          onClick={() => handleTabChange('managers')}
        >
          <Users size={16} /> Registered Managers ({counts.total})
        </button>
      </nav>

      {/* TAB 1: ALL ACTIVITY LOGS IN ONE PLACE */}
      {activeTab === 'logs' && (
        <section className="admin-card" aria-labelledby="all-activity-heading">
          <div className="admin-card-head admin-card-head-split">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} />
              <h2 id="all-activity-heading">Activity Logs</h2>
            </div>
            <button
              type="button"
              className="activity-refresh"
              onClick={loadLogs}
              disabled={loadingLogs}
              title="Refresh logs"
            >
              <RefreshCw size={14} className={loadingLogs ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {/* Filter Bar */}
          <div className="activity-filters">
            {/* Search filter */}
            <div className="admin-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search logs, players, stats…"
                aria-label="Search activity"
              />
            </div>

            {/* Manager filter */}
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              aria-label="Filter by manager"
              className="admin-filter"
            >
              <option value="all">All managers ({managers.length})</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>

            {/* Type/Category filter */}
            <select
              value={logCategory}
              onChange={(e) => setLogCategory(e.target.value)}
              aria-label="Filter by activity type"
              className="admin-filter"
            >
              <option value="all">All activity types</option>
              {ACTIVITY_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Date range filters */}
            <label className="activity-date">
              <span>From</span>
              <input
                type="date"
                value={logFromDate}
                max={logToDate || undefined}
                onChange={(e) => setLogFromDate(e.target.value)}
                aria-label="From date"
              />
            </label>
            <label className="activity-date">
              <span>To</span>
              <input
                type="date"
                value={logToDate}
                min={logFromDate || undefined}
                onChange={(e) => setLogToDate(e.target.value)}
                aria-label="To date"
              />
            </label>

            {anyLogFilterActive && (
              <button type="button" className="activity-clear" onClick={clearLogFilters}>
                Clear filters
              </button>
            )}
          </div>

          {/* Counts & Status */}
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            {anyLogFilterActive ? (
              <span>Showing <strong>{visibleLogs.length}</strong> of <strong>{logs.length}</strong> loaded logs</span>
            ) : (
              <span>Total <strong>{logs.length}</strong> activity logs loaded</span>
            )}
            {selectedManagerId !== 'all' && (
              <span style={{ marginLeft: 8 }}>
                (Filtered for: <strong>{managers.find((m) => m.id === selectedManagerId)?.name || 'Manager'}</strong>)
              </span>
            )}
          </div>

          {errorLogs && <div className="auth-error" role="alert">{errorLogs}</div>}
          {loadingLogs && <p className="admin-muted">Loading activity logs…</p>}

          {!loadingLogs && !errorLogs && logs.length === 0 && (
            <p className="admin-muted">No activity has been recorded yet.</p>
          )}

          {!loadingLogs && logs.length > 0 && visibleLogs.length === 0 && (
            <p className="admin-muted">No activity logs match your filter criteria.</p>
          )}

          {/* Logs List */}
          {logRows.length > 0 && (
            <ul className="activity-list">
              {logRows.map((row) =>
                row.kind === 'day' ? (
                  <li key={row.key} className="activity-day">{row.label}</li>
                ) : (
                  <li key={row.key} className="activity-item">
                    <time className="activity-time" dateTime={toDate(row.entry.at)?.toISOString()}>
                      {formatTime(row.entry.at)}
                    </time>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`activity-badge activity-badge-${categoryOf(row.entry.type)}`}>
                        {categoryLabel(categoryOf(row.entry.type))}
                      </span>
                      {row.entry.managerName && (
                        <span className="activity-manager-badge" title={row.entry.managerEmail || ''}>
                          {row.entry.managerName}
                        </span>
                      )}
                    </div>
                    <span className="activity-message">
                      {formatActivityMessage(row.entry.message, row.entry.type)}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      )}

      {/* TAB 2: REGISTERED MANAGERS */}
      {activeTab === 'managers' && (
        <section className="admin-card" aria-labelledby="managers-heading">
          <div className="admin-card-head">
            <Users size={18} />
            <h2 id="managers-heading">Registered Managers</h2>
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
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
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

          {loadingManagers && <p className="admin-muted">Loading managers…</p>}
          {errorManagers && <div className="auth-error" role="alert">{errorManagers}</div>}
          {!loadingManagers && !errorManagers && managers.length === 0 && (
            <p className="admin-muted">No managers have registered yet.</p>
          )}
          {!loadingManagers && managers.length > 0 && visibleManagers.length === 0 && (
            <p className="admin-muted">No managers match your search.</p>
          )}

          {visibleManagers.length > 0 && (
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
                  {visibleManagers.map((m) => {
                    const isBlocked = m.status === MANAGER_STATUS.BLOCKED;
                    const isSelf = m.id === user?.uid;
                    return (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
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
                          <div className="admin-actions">
                            <button
                              type="button"
                              className="admin-btn-activity"
                              onClick={() => handleViewManagerLogs(m.id)}
                              aria-label={`View logs of ${m.name}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <History size={14} /> View Logs
                            </button>
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
