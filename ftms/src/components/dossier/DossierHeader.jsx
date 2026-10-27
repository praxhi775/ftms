import { Share2, SlidersHorizontal } from 'lucide-react';

export default function DossierHeader({ onEditRatings, onExportSheet }) {
  return (
    <header className="dossier-header-bar" style={{ justifyContent: 'flex-end' }}>
      
    

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
