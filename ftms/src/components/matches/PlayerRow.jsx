import { Check } from 'lucide-react';

export default function PlayerRow({ player, onToggle }) {
  const {
    id,
    name,
    position,
    role,
    initials,
    selected,
    statusDetail,
  } = player;

  const isInjured = statusDetail === 'Injured';
  const isUnavailable = statusDetail === 'Unavailable';

  return (
    <div
      className={`player-row ${selected ? 'is-selected' : 'is-unselected'}`}
      onClick={() => onToggle(id)}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle(id);
        }
      }}
    >
      {/* Custom Checkbox */}
      <div className={`player-checkbox ${selected ? 'checked' : ''}`} aria-hidden="true">
        {selected && <Check size={14} strokeWidth={3} />}
      </div>

      {/* Avatar Circle */}
      <div className="player-avatar" aria-hidden="true">
        {initials}
      </div>

      {/* Player Identity */}
      <div className="player-info-col">
        <div className="player-name-line">
          <span className="player-name">{name}</span>
          {isInjured && (
            <span className="status-badge badge-injured">Injured</span>
          )}
          {isUnavailable && (
            <span className="status-badge badge-unavailable">Unavailable</span>
          )}
        </div>
        <span className="player-role-text">{role}</span>
      </div>

      {/* Position Badge */}
      <div className="player-position-col">
        <span className={`position-badge pos-${position.toLowerCase()}`}>
          {position}
        </span>
      </div>
    </div>
  );
}
