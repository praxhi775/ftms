import { AlertTriangle, X } from 'lucide-react';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) {
  const modalRef = useModalFocusTrap({ isOpen, onClose: onCancel, initialFocusSelector: '.btn-modal-cancel' });

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={modalRef}
        className="modal-content-card"
        style={{ maxWidth: '420px', padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: confirmVariant === 'danger' ? '#FEE2E2' : '#FEF3C7',
              color: confirmVariant === 'danger' ? '#DC2626' : '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 id="confirm-dialog-title" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              backgroundColor: confirmVariant === 'danger' ? '#DC2626' : 'var(--forest-green)',
              color: '#fff',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
