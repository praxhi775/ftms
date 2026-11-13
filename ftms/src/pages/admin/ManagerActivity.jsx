import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LogOut, RefreshCw, Search } from 'lucide-react';
import AppLogo from '../../components/common/AppLogo';
import { useAuth } from '../../context/useAuth';
import { friendlyAuthError } from '../../firebase/authErrors';
import { ACTIVITY_PAGE_SIZE, fetchActivityPage, getManager } from '../../services/adminService';
import { ACTIVITY_CATEGORIES, categoryLabel, categoryOf } from '../../utils/activityTypes';
import { dayLabel, formatTime, formatTimestamp, toDate } from '../../utils/dates';

const MAX_AUTO_PAGES = 4; // while a filter is active, keep loading older pages up to this many times

// "2026-11-07" (from a date input) -> start / end of that day in the admin's time zone
const startOfInputDay = (value) => (value ? new Date(`${value}T00:00:00`) : null);
const endOfInputDay = (value) => (value ? new Date(`${value}T23:59:59.999`) : null);

export default function ManagerActivity() {
  const { id } = useParams();
  const { logout } = useAuth();

  const [manager, setManager] = useState(null);
  const [entries, setEntries] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDateValue, setToDateValue] = useState('');
  const autoPagesRef = useRef(0);

  useEffect(() => {
    document.title = 'Activity | FTMS';
  }, []);

  useEffect(() => {
    let cancelled = false;
    getManager(id)
      .then((m) => {
        if (!cancelled) setManager(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  // First page (and again whenever the date range changes: that part is filtered on the server)
  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await fetchActivityPage(id, {
        from: startOfInputDay(fromDate),
        to: endOfInputDay(toDateValue),
      });
      setEntries(page.entries);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      autoPagesRef.current = 0;
    } catch (err) {
      setError(friendlyAuthError(err));
      setEntries([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [id, fromDate, toDateValue]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchActivityPage(id, {
        after: cursor,
        from: startOfInputDay(fromDate),
        to: endOfInputDay(toDateValue),
      });
      setEntries((prev) => [...prev, ...page.entries]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [id, cursor, hasMore, loadingMore, fromDate, toDateValue]);

  // Category and search are applied to the loaded entries
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (category !== 'all' && categoryOf(e.type) !== category) return false;
      return !q || (e.message || '').toLowerCase().includes(q);
    });
  }, [entries, category, search]);

  const filtersActive = category !== 'all' || search.trim() !== '';

  // With a filter on and few matches, quietly look further back (a few pages at most)
  useEffect(() => {
    if (!filtersActive || loading || loadingMore || !hasMore) return;
    if (visible.length >= 15 || autoPagesRef.current >= MAX_AUTO_PAGES) return;
    autoPagesRef.current += 1;
    loadMore();
  }, [filtersActive, loading, loadingMore, hasMore, visible.length, loadMore]);

  const clearFilters = () => {
    setCategory('all');
    setSearch('');
    setFromDate('');
    setToDateValue('');
    autoPagesRef.current = 0;
  };

  const anyFilter = filtersActive || fromDate || toDateValue;

  // day headings: "Today", "Yesterday", ...
  const rows = [];
  let lastDay = null;
  visible.forEach((e) => {
    const day = dayLabel(e.at);
    if (day !== lastDay) {
      rows.push({ kind: 'day', key: `day-${day}-${e.id}`, label: day });
      lastDay = day;
    }
    rows.push({ kind: 'entry', key: e.id, entry: e });
  });

  const status = manager?.status === 'blocked' ? 'blocked' : 'active';

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-title-group">
          <AppLogo size={40} alt="FTMS" />
          <div>
            <h1 className="admin-title">Activity{manager ? `: ${manager.name}` : ''}</h1>
            <span className="admin-sub">{manager?.email || 'Loading…'}</span>
          </div>
        </div>
        <button type="button" className="auth-btn-secondary" onClick={logout}>
          <LogOut size={15} /> Log out
        </button>
      </header>

      <Link to="/admin" className="admin-back-link">
        <ArrowLeft size={15} /> All managers
      </Link>

      <section className="admin-card" aria-labelledby="activity-heading">
        {manager && (
          <div className="activity-summary">
            <div><span>Status</span><strong className={`admin-status admin-status-${status}`}>{status}</strong></div>
            <div><span>Joined</span><strong>{formatTimestamp(manager.createdAt)}</strong></div>
            <div><span>Last login</span><strong>{formatTimestamp(manager.lastLoginAt)}</strong></div>
            <div><span>Last active</span><strong>{formatTimestamp(manager.lastActiveAt)}</strong></div>
          </div>
        )}

        <div className="admin-card-head admin-card-head-split">
          <h2 id="activity-heading">Activity log</h2>
          <button type="button" className="activity-refresh" onClick={loadFirstPage} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="activity-filters">
          <div className="admin-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                autoPagesRef.current = 0;
                setSearch(e.target.value);
              }}
              placeholder="Search activity…"
              aria-label="Search activity"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              autoPagesRef.current = 0;
              setCategory(e.target.value);
            }}
            aria-label="Filter by type"
            className="admin-filter"
          >
            <option value="all">All types</option>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <label className="activity-date">
            <span>From</span>
            <input type="date" value={fromDate} max={toDateValue || undefined} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
          </label>
          <label className="activity-date">
            <span>To</span>
            <input type="date" value={toDateValue} min={fromDate || undefined} onChange={(e) => setToDateValue(e.target.value)} aria-label="To date" />
          </label>
          {anyFilter && (
            <button type="button" className="activity-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {loading && <p className="admin-muted">Loading activity…</p>}

        {!loading && !error && entries.length === 0 && (
          <p className="admin-muted">
            {fromDate || toDateValue ? 'No activity in this date range.' : 'No activity has been recorded for this manager yet.'}
          </p>
        )}
        {!loading && entries.length > 0 && visible.length === 0 && (
          <p className="admin-muted">
            No loaded entries match your filters.{hasMore ? ' Load more to search older activity.' : ''}
          </p>
        )}

        {rows.length > 0 && (
          <ul className="activity-list">
            {rows.map((row) =>
              row.kind === 'day' ? (
                <li key={row.key} className="activity-day">{row.label}</li>
              ) : (
                <li key={row.key} className="activity-item">
                  <time className="activity-time" dateTime={toDate(row.entry.at)?.toISOString()}>
                    {formatTime(row.entry.at)}
                  </time>
                  <span className={`activity-badge activity-badge-${categoryOf(row.entry.type)}`}>
                    {categoryLabel(categoryOf(row.entry.type))}
                  </span>
                  <span className="activity-message">{row.entry.message}</span>
                </li>
              )
            )}
          </ul>
        )}

        {!loading && entries.length > 0 && (
          <div className="activity-footer">
            <span className="admin-muted">
              {filtersActive
                ? `${visible.length} matching of ${entries.length} loaded`
                : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} loaded`}
            </span>
            {hasMore && (
              <button type="button" className="auth-btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load ${ACTIVITY_PAGE_SIZE} more`}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
