import { useState, useEffect } from 'react';
import { X, CheckCircle, Shield, Palette } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { PRESET_JERSEY_COLORS } from './teamColors';

export default function TeamFormModal({
  isOpen,
  onClose,
  onSave,
  teamToEdit = null,
  teamIndex = 0,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose, initialFocusSelector: '#team-name-input' });
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_JERSEY_COLORS[0].bg);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    if (teamToEdit) {
      setName(teamToEdit.name || '');
      setColor(teamToEdit.color || PRESET_JERSEY_COLORS[teamIndex % PRESET_JERSEY_COLORS.length].bg);
    } else {
      const defaultName = `Team ${String.fromCharCode(65 + teamIndex)}`;
      setName(defaultName);
      setColor(PRESET_JERSEY_COLORS[teamIndex % PRESET_JERSEY_COLORS.length].bg);
    }
    setError(null);
  }, [isOpen, teamToEdit, teamIndex]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Team name is required.');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Team name cannot exceed 50 characters.');
      return;
    }

    onSave({
      name: trimmedName,
      color: color || PRESET_JERSEY_COLORS[teamIndex % PRESET_JERSEY_COLORS.length].bg,
    });
    onClose();
  };

  const isEditing = Boolean(teamToEdit);
  const previewLetter = name.trim() ? name.trim().charAt(0).toUpperCase() : String.fromCharCode(65 + teamIndex);

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header-row">
          <div className="modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--pale-green-bg)',
              color: 'var(--forest-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={16} />
            </div>
            <div>
              <h2 id="team-modal-title" className="modal-heading" style={{ margin: 0, fontSize: '18px' }}>
                {isEditing ? 'Edit Team Details' : 'Create New Team'}
              </h2>
              <p className="modal-description" style={{ margin: 0, fontSize: '12px' }}>
                {isEditing ? 'Update team name and jersey color' : 'Set team name and kit jersey color'}
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontSize: '12.5px',
              border: '1px solid #FCA5A5'
            }}>
              {error}
            </div>
          )}

          {/* Live Preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'background-color 0.15s ease'
            }}>
              {previewLetter}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {name.trim() || 'Untitled Team'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Jersey Kit Preview • {color.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Team Name Input */}
          <div className="rating-input-field">
            <label htmlFor="team-name-input" className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px' }}>
              Team Name <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="team-name-input"
              autoFocus
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Team Green, Thunder FC, Blue Strikers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Jersey Color Picker */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="rating-field-label" style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>
                Jersey / Kit Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Custom:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '24px',
                    height: '24px',
                    padding: 0,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: 'none'
                  }}
                  title="Pick custom color"
                />
              </div>
            </div>

            {/* Preset Color Swatches */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              padding: '8px',
              backgroundColor: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px'
            }}>
              {PRESET_JERSEY_COLORS.map((preset) => {
                const isSelected = color.toLowerCase() === preset.bg.toLowerCase();
                return (
                  <button
                    key={preset.bg}
                    type="button"
                    onClick={() => setColor(preset.bg)}
                    title={preset.name}
                    style={{
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: preset.bg,
                      border: isSelected ? '3px solid #111827' : '1px solid rgba(0,0,0,0.1)',
                      outline: isSelected ? '2px solid #fff' : 'none',
                      outlineOffset: '-4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'transform 0.1s ease',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {isSelected && (
                      <CheckCircle size={14} color="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-footer" style={{ marginTop: '8px' }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} />
              <span>{isEditing ? 'Save Changes' : 'Create Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
