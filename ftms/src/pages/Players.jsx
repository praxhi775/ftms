import { useState, useMemo } from 'react';
import DossierHeader from '../components/dossier/DossierHeader';
import AttributeRadarChart from '../components/dossier/AttributeRadarChart';
import PlayerTraitsPanel from '../components/dossier/PlayerTraitsPanel';
import SubMetricBreakdown from '../components/dossier/SubMetricBreakdown';
import EditRatingsModal from '../components/dossier/EditRatingsModal';

const INITIAL_RATINGS = {
  pac: 82,
  sho: 85,
  pas: 76,
  dri: 86,
  def: 43,
  phy: 76,
};

export default function Players() {
  const [ratings, setRatings] = useState(INITIAL_RATINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamically calculate Winger OVR (Overall Rating) based on updated attributes
  const ovrRating = useMemo(() => {
    const calculated =
      0.35 * ratings.dri +
      0.3 * ratings.pac +
      0.2 * ratings.sho +
      0.1 * ratings.pas +
      0.05 * ratings.phy;
    return Math.round(calculated);
  }, [ratings]);

  const handleExportSheet = () => {
    setToastMessage('Player Dossier sheet prepared for export.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="player-dossier-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Action Bar */}
      <DossierHeader
        onEditRatings={() => setIsModalOpen(true)}
        onExportSheet={handleExportSheet}
      />

      {/* Main Player Profile Card */}
      <section className="player-profile-main-card" aria-label="Player Profile Dossier">
        {/* Profile Header: Number badge, Name, OVR, Metadata */}
        <div className="profile-identity-header">
          <div className="squad-number-badge-wrap">
            <div className="squad-number-circle" aria-label="Squad Number 11">
              11
            </div>
            <div className="position-subbadge" aria-label="Position Left Wing">
              LW
            </div>
          </div>

          <div className="profile-name-group">
            <div className="name-and-ovr-row">
              <h1 className="player-full-name">
                Marcus "Speedy" Vance
              </h1>
              <span className="ovr-pill-badge" aria-label={`Overall Rating ${ovrRating}`}>
                OVR {ovrRating}
              </span>
            </div>

            <div className="player-meta-inline">
              <span className="meta-position-tag">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="meta-icon"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                </svg>
                Left Wing (LW / LM)
              </span>
              <span className="meta-bullet">•</span>
              <span>Age 27</span>
              <span className="meta-bullet">•</span>
              <span>Squad #11</span>
              <span className="meta-bullet">•</span>
              <span>178 cm / 72 kg</span>
            </div>
          </div>
        </div>

        {/* Profile Body: 7:5 ratio (Radar Chart & Trait Stack) */}
        <div className="profile-body-grid">
          {/* Left Column (7): Attribute Profile with Radar Chart */}
          <div className="profile-radar-col">
            <AttributeRadarChart ratings={ratings} />
          </div>

          {/* Right Column (5): Player Traits Panel */}
          <div className="profile-traits-col">
            <PlayerTraitsPanel />
          </div>
        </div>
      </section>

      {/* Category Sub-Metric Breakdown Card */}
      <SubMetricBreakdown />

      {/* Edit Primary Ratings Modal Dialog */}
      {isModalOpen && (
        <EditRatingsModal
          initialRatings={ratings}
          onClose={() => setIsModalOpen(false)}
          onUpdateRatings={(newRatings) => {
            setRatings(newRatings);
            setToastMessage('Attribute ratings updated successfully.');
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}
