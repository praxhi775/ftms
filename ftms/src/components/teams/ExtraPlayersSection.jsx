import { useState } from 'react';
import { UserPlus, Plus, Check } from 'lucide-react';
import { EXTRA_PLAYER } from './teamsData';

export default function ExtraPlayersSection({ onAllocationChange }) {
  // 'bench' | 'teamA' | 'teamB'
  const [allocation, setAllocation] = useState('bench');

  const handleSelect = (choice) => {
    setAllocation(choice);
    if (onAllocationChange) onAllocationChange(choice);
  };

  return (
    <section className="extra-players-card" aria-labelledby="extra-players-title">
      {/* Header */}
      <div className="extra-players-header">
        <div className="extra-title-group">
          <div className="extra-icon-box" aria-hidden="true">
            <UserPlus size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h2 id="extra-players-title" className="extra-main-title">
              Extra Players (1 player)
            </h2>
            <p className="extra-description">
              Decide where to allocate extra squad members for fair play.
            </p>
          </div>
        </div>

        <span className="registered-count-pill">
          15 of 14 Registered
        </span>
      </div>

      {/* Extra Player Item Row */}
      <div className="extra-player-row">
        <div className="extra-player-info-col">
          <div className="extra-avatar-circle" aria-hidden="true">
            {EXTRA_PLAYER.initials}
          </div>

          <div className="extra-meta-texts">
            <div className="extra-name-pos-row">
              <span className="extra-player-name">{EXTRA_PLAYER.name}</span>
              <span className="extra-pos-badge">{EXTRA_PLAYER.position}</span>
            </div>
            <p className="extra-subtext">{EXTRA_PLAYER.description}</p>
          </div>
        </div>

        {/* 3 Mutually Exclusive Allocation Buttons */}
        <div className="extra-allocation-actions" role="group" aria-label="Allocate extra player">
          <button
            type="button"
            className={`btn-allocation-opt ${allocation === 'teamA' ? 'is-active' : ''}`}
            onClick={() => handleSelect('teamA')}
            aria-pressed={allocation === 'teamA'}
          >
            {allocation === 'teamA' ? (
              <Check size={13} strokeWidth={3} />
            ) : (
              <Plus size={13} strokeWidth={2.5} />
            )}
            <span>Add to Team A</span>
          </button>

          <button
            type="button"
            className={`btn-allocation-opt ${allocation === 'teamB' ? 'is-active' : ''}`}
            onClick={() => handleSelect('teamB')}
            aria-pressed={allocation === 'teamB'}
          >
            {allocation === 'teamB' ? (
              <Check size={13} strokeWidth={3} />
            ) : (
              <Plus size={13} strokeWidth={2.5} />
            )}
            <span>Add to Team B</span>
          </button>

          <button
            type="button"
            className={`btn-allocation-opt ${allocation === 'bench' ? 'is-active' : ''}`}
            onClick={() => handleSelect('bench')}
            aria-pressed={allocation === 'bench'}
          >
            {allocation === 'bench' && <Check size={13} strokeWidth={3} />}
            <span>
              Keep on Bench / Rotate {allocation === 'bench' ? '(Active)' : ''}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
