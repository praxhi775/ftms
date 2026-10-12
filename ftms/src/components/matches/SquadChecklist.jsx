import { Search, CheckCheck, X } from 'lucide-react';
import PlayerRow from './PlayerRow';

const POSITION_FILTERS = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];

export default function SquadChecklist({
  players,
  filteredPlayers,
  searchQuery,
  onSearchChange,
  positionFilter,
  onFilterChange,
  onTogglePlayer,
  onSelectAll,
  onClearAll,
}) {
  const selectedCount = players.filter((p) => p.selected).length;
  const totalCount = players.length;
  const attendancePct = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  return (
    <div className="squad-checklist-card">
      {/* Header */}
      <div className="checklist-header">
        <div className="checklist-title-group">
          <h2 className="checklist-title">Squad Checklist</h2>
          <p className="checklist-subtitle">Tap to mark matchday availability</p>
        </div>

        <div className="checklist-quick-actions">
          <button
            type="button"
            className="btn-text-action btn-select-all"
            onClick={onSelectAll}
            aria-label="Select all squad members"
          >
            <CheckCheck size={14} strokeWidth={2.5} />
            <span>Select All</span>
          </button>
          <button
            type="button"
            className="btn-text-action btn-clear-all"
            onClick={onClearAll}
            aria-label="Clear all selections"
          >
            <X size={14} strokeWidth={2.5} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Chips Row */}
      <div className="checklist-filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, role, or pos"
            aria-label="Search players by name, role, or position"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="position-chips-group" role="tablist" aria-label="Filter by position">
          {POSITION_FILTERS.map((pos) => {
            const isActive = positionFilter === pos;
            return (
              <button
                key={pos}
                type="button"
                className={`pos-chip ${isActive ? 'active' : ''}`}
                onClick={() => onFilterChange(pos)}
                role="tab"
                aria-selected={isActive}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Attendance Summary Bar */}
      <div className="attendance-summary-bar">
        <div className="attendance-left">
          <span className="attendance-dot" aria-hidden="true"></span>
          <span className="attendance-count-text">
            Selected <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> players
          </span>
        </div>
        <div className="attendance-right">
          <span className="attendance-pct-badge">{attendancePct}% attendance</span>
        </div>
      </div>

      {/* Scrollable Player List */}
      <div className="player-list-scrollable" role="group" aria-label="Player list">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              onToggle={onTogglePlayer}
            />
          ))
        ) : (
          <div className="player-empty-match">
            <p className="empty-match-text">
              No players found matching "<strong>{searchQuery || positionFilter}</strong>".
            </p>
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                onSearchChange('');
                onFilterChange('ALL');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
