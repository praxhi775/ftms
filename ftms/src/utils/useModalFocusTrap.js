import { useEffect, useRef } from 'react';

/**
 * Custom hook to trap keyboard focus within a modal and close on Escape key.
 *
 * @param {Object} options
 * @param {boolean} options.isOpen - Whether the modal is currently open
 * @param {Function} options.onClose - Callback invoked when Escape key is pressed
 * @param {string} [options.initialFocusSelector] - Optional selector for initial focus
 * @returns {React.RefObject} - Ref to attach to the modal container element
 */
export function useModalFocusTrap({ isOpen, onClose, initialFocusSelector }) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember currently focused element before modal opened
    previousFocusRef.current = document.activeElement;

    const modalElement = containerRef.current;
    if (!modalElement) return;

    // Focus first appropriate element
    const focusTimer = setTimeout(() => {
      if (initialFocusSelector) {
        const target = modalElement.querySelector(initialFocusSelector);
        if (target && typeof target.focus === 'function') {
          target.focus();
          return;
        }
      }

      const focusable = modalElement.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          modalElement.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !modalElement.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalElement.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore previous focus on unmount
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusSelector]);

  return containerRef;
}
