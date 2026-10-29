import { useState } from 'react';
import { Shuffle, CheckCircle2 } from 'lucide-react';

export default function TeamsGeneratedHeader({ onShuffle, onConfirm }) {
  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffleClick = () => {
    setIsShuffling(true);
    if (onShuffle) onShuffle();
    setTimeout(() => setIsShuffling(false), 500);
  };

  return (
    <header className="teams-generated-header">
      <div className="teams-header-text">
        <h1 className="teams-main-title">Teams Generated</h1>
        <p className="teams-subtitle">
          2 teams of 7 players created. Bench rotation configured.
        </p>
      </div>

      <div className="teams-header-actions">
        <button
          type="button"
          className="btn-teams-action btn-shuffle-again"
          onClick={handleShuffleClick}
          aria-label="Shuffle teams again"
        >
          <Shuffle
            size={15}
            strokeWidth={2.4}
            className={`shuffle-icon ${isShuffling ? 'is-spinning' : ''}`}
            aria-hidden="true"
          />
          <span>Shuffle again</span>
        </button>

        <button
          type="button"
          className="btn-teams-action btn-confirm-match"
          onClick={onConfirm}
          aria-label="Confirm generated matchday squads"
        >
          <CheckCircle2 size={16} strokeWidth={2.4} aria-hidden="true" />
          <span>Confirm session</span>
        </button>
      </div>
    </header>
  );
}