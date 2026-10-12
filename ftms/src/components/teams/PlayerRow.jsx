import { ArrowLeftRight } from 'lucide-react';

export default function PlayerRow({ player, onSwap }) {
  const { position, name } = player;

  return (
    <div className="team-player-row">
      <div className="player-row-left">
        <span className="player-pos-badge" aria-label={`Position ${position}`}>
          {position}
        </span>
        <span className="player-display-name">{name}</span>
      </div>

      <button
        type="button"
        className="btn-swap-player"
        onClick={() => onSwap && onSwap(player)}
        aria-label={`Swap ${name}`}
        title={`Swap ${name}`}
      >
        <ArrowLeftRight size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}
