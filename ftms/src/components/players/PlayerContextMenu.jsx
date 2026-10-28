import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit3, Trash2 } from 'lucide-react';

const MENU_WIDTH = 200;
const MENU_HEIGHT = 150;

/**
 * Right-click menu for a player.
 * menu: { x, y, player } | null
 */
export default function PlayerContextMenu({ menu, onClose, onView, onEdit, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;

    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const items = menuRef.current ? [...menuRef.current.querySelectorAll('[role="menuitem"]')] : [];
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === 'Tab') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);

    // Focus the first option so the menu works with the keyboard too
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  // Keep the menu inside the screen
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - MENU_WIDTH - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - MENU_HEIGHT - 8));

  const itemBase = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 12px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  };

  const run = (fn) => () => {
    const player = menu.player;
    onClose();
    fn(player);
  };

  const hoverOn = (e) => { e.currentTarget.style.backgroundColor = '#F3EFE6'; };
  const hoverOff = (e) => { e.currentTarget.style.backgroundColor = 'transparent'; };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${menu.player.name}`}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 1000,
        width: MENU_WIDTH,
        padding: '6px',
        backgroundColor: '#fff',
        border: '1px solid var(--border-strong, #D1D5DB)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-float, 0 10px 30px rgba(0,0,0,0.15))',
      }}
    >
      <div style={{ padding: '6px 12px 6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {menu.player.name}
      </div>

      <button type="button" role="menuitem" style={itemBase} onClick={run(onView)} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onFocus={hoverOn} onBlur={hoverOff}>
        <Eye size={15} />
        <span>View Profile</span>
      </button>

      <button type="button" role="menuitem" style={itemBase} onClick={run(onEdit)} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onFocus={hoverOn} onBlur={hoverOff}>
        <Edit3 size={15} />
        <span>Edit Profile</span>
      </button>

      <button
        type="button"
        role="menuitem"
        style={{ ...itemBase, color: '#DC2626' }}
        onClick={run(onDelete)}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
        onMouseLeave={hoverOff}
        onFocus={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
        onBlur={hoverOff}
      >
        <Trash2 size={15} />
        <span>Delete</span>
      </button>
    </div>,
    document.body
  );
}