import { Share2, SlidersHorizontal } from 'lucide-react';

export default function DossierHeader({ onEditRatings, onExportSheet }) {
  return (
    <header className="dossier-header-bar">
      {/* Breadcrumb Context */}
      <nav className="dossier-breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb-root">SQUAD DOSSIER</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-sub">Forward Line</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">#11 Vance</span>
      </nav>

      {/* Action Buttons */}
      <div className="dossier-header-actions">
        <button
          type="button"
          className="btn-dossier-action btn-export-sheet"
          onClick={onExportSheet}
          aria-label="Export Player Sheet"
        >
          <Share2 size={15} strokeWidth={2.2} />
          <span>Export Sheet</span>
        </button>

        <button
          type="button"
          className="btn-dossier-action btn-edit-ratings"
          onClick={onEditRatings}
          aria-label="Edit Primary Ratings"
        >
          <SlidersHorizontal size={15} strokeWidth={2.2} />
          <span>Edit Ratings</span>
        </button>
      </div>
    </header>
  );
}
