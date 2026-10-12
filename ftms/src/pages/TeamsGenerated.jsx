import { useState } from 'react';
import TeamsGeneratedHeader from '../components/teams/TeamsGeneratedHeader';
import MatchdayBanner from '../components/teams/MatchdayBanner';
import TeamCard from '../components/teams/TeamCard';
import ExtraPlayersSection from '../components/teams/ExtraPlayersSection';
import { TEAM_GREEN, TEAM_WHITE } from '../components/teams/teamsData';

export default function TeamsGenerated() {
  const [teamA, setTeamA] = useState(TEAM_GREEN);
  const [teamB, setTeamB] = useState(TEAM_WHITE);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShuffle = () => {
    // Lightweight simulated shuffle: randomizes order of players
    setTeamA((prev) => ({
      ...prev,
      players: [...prev.players].sort(() => Math.random() - 0.5),
    }));
    setTeamB((prev) => ({
      ...prev,
      players: [...prev.players].sort(() => Math.random() - 0.5),
    }));
    showToast('Squad positions shuffled.');
  };

  const handleConfirm = () => {
    showToast('Match confirmed! Sunday rosters locked.');
  };

  const handleSwapPlayer = (player) => {
    showToast(`Swap requested for ${player.name}.`);
  };

  return (
    <div className="teams-generated-page">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header with Action Buttons */}
      <TeamsGeneratedHeader
        onShuffle={handleShuffle}
        onConfirm={handleConfirm}
      />

      {/* Matchday Banner Card with Pitch Line Background */}
      <MatchdayBanner />

      {/* Two Team Cards Side by Side */}
      <div className="teams-dual-cards-grid">
        <TeamCard
          team={teamA}
          onSwapPlayer={handleSwapPlayer}
        />
        <TeamCard
          team={teamB}
          onSwapPlayer={handleSwapPlayer}
        />
      </div>

      {/* Extra Players Section */}
      <ExtraPlayersSection
        onAllocationChange={(choice) => {
          if (choice === 'teamA') showToast('Chris Evans assigned to Team A.');
          else if (choice === 'teamB') showToast('Chris Evans assigned to Team B.');
          else showToast('Chris Evans held on bench rotation.');
        }}
      />
    </div>
  );
}
