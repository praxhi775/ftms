import { Sliders, Minus, Plus, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import TeamDistribution from './TeamDistribution';

export default function MatchConfiguration({
  config,
  onUpdateTeams,
  onUpdatePlayersPerTeam,
  selectedCount,
  onGenerateTeams,
}) {
  const { numberOfTeams, playersPerTeam } = config;
  const requiredPlayers = numberOfTeams * playersPerTeam;
  const surplus = selectedCount - requiredPlayers;
  const isSufficient = selectedCount >= requiredPlayers;

  const minTeams = 2;
  const maxTeams = 4;
  const minPlayers = 3;
  const maxPlayers = 11;

  return (
    <div className="match-config-card">
      {/* Card Header */}
      <div className="match-config-header">
        <div className="config-title-group">
          <Sliders size={18} className="config-header-icon" aria-hidden="true" />
          <h2 className="config-title">Match Format</h2>
        </div>
        <span className="step-badge">Step 1 of 2</span>
      </div>

      <div className="config-controls-container">
        {/* Number of Teams */}
        <div className="config-parameter-row">
          <div className="parameter-meta">
            <span className="parameter-label">Number of teams (N)</span>
            <span className="parameter-sublabel">
              {numberOfTeams === 2 ? 'Default 2 sides' : `${numberOfTeams} sides`}
            </span>
          </div>
          <div className="stepper-box">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onUpdateTeams(-1)}
              disabled={numberOfTeams <= minTeams}
              aria-label="Decrease number of teams"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span className="stepper-value" aria-live="polite">
              {numberOfTeams}
            </span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onUpdateTeams(1)}
              disabled={numberOfTeams >= maxTeams}
              aria-label="Increase number of teams"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Players per Team */}
        <div className="config-parameter-row">
          <div className="parameter-meta">
            <span className="parameter-label">Players per team (T)</span>
            <span className="parameter-sublabel">
              {playersPerTeam}-a-side match
            </span>
          </div>
          <div className="stepper-box">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onUpdatePlayersPerTeam(-1)}
              disabled={playersPerTeam <= minPlayers}
              aria-label="Decrease players per team"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span className="stepper-value" aria-live="polite">
              {playersPerTeam}
            </span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onUpdatePlayersPerTeam(1)}
              disabled={playersPerTeam >= maxPlayers}
              aria-label="Increase players per team"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Visual Distribution */}
        <TeamDistribution
          numberOfTeams={numberOfTeams}
          playersPerTeam={playersPerTeam}
        />

        {/* Squad Requirement & Validation Box */}
        <div
          className={`validation-status-box ${
            isSufficient ? 'status-sufficient' : 'status-insufficient'
          }`}
        >
          <div className="validation-top">
            {isSufficient ? (
              <CheckCircle size={16} className="validation-icon icon-success" />
            ) : (
              <AlertCircle size={16} className="validation-icon icon-warning" />
            )}
            <span className="validation-math">
              Currently: {numberOfTeams} teams × {playersPerTeam} = {requiredPlayers} players needed.
            </span>
          </div>

          <div className="validation-detail">
            {isSufficient ? (
              surplus > 0 ? (
                <span>
                  <strong>{surplus} surplus player{surplus > 1 ? 's' : ''}</strong> available for the bench or rotation.
                </span>
              ) : (
                <span>
                  <strong>Exact match!</strong> All {selectedCount} selected players will be on pitch.
                </span>
              )
            ) : (
              <span>
                Need <strong>{requiredPlayers - selectedCount} more player{requiredPlayers - selectedCount > 1 ? 's' : ''}</strong> to fill lineup ({selectedCount}/{requiredPlayers} selected).
              </span>
            )}
          </div>
        </div>

        {/* Generate Balanced Teams Button */}
        <button
          type="button"
          className="btn-generate-teams"
          onClick={onGenerateTeams}
          disabled={!isSufficient}
        >
          <Sparkles size={16} strokeWidth={2.2} />
          <span>Generate balanced teams</span>
        </button>
      </div>
    </div>
  );
}
