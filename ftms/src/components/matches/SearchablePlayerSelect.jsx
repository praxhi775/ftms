import { useState, useMemo, useRef, useId } from 'react';
import { Search, ChevronDown } from 'lucide-react';

/**
 * Searchable dropdown for picking a player.
 * groups: [{ label, members: [{ id, name, jerseyNumber, isGuest }] }]
 */
export default function SearchablePlayerSelect({ groups, value, onChange, placeholder = 'Search player…' }) {
  const listId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const labelOf = (p) =>
    `${p.jerseyNumber != null && p.jerseyNumber !== '' ? `#${p.jerseyNumber} ` : ''}${p.name}${p.isGuest ? ' (Guest)' : ''}`;

  const selected = useMemo(() => {
    for (const g of groups) {
      const found = g.members.find((m) => String(m.id) === String(value));
      if (found) return found;
    }
    return null;
  }, [groups, value]);

  // Filter by name or jersey number, keeping team groups
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        members: g.members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            String(m.jerseyNumber ?? '').toLowerCase() === q.replace('#', '')
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [groups, query]);

  const flat = useMemo(() => filteredGroups.flatMap((g) => g.members), [filteredGroups]);

  const choose = (player) => {
    onChange(player.id);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (flat[activeIdx]) choose(flat[activeIdx]);
    }
  };

  const showSelectedLabel = !open && selected && query === '';
  const indexById = new Map(flat.map((p, i) => [String(p.id), i]));

  return (
    <div style={{ position: 'relative' }}>
      <Search
        size={15}
        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
      />
      <input
        ref={inputRef}
        id="activity-player"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && flat[activeIdx] ? `${listId}-${flat[activeIdx].id}` : undefined}
        autoComplete="off"
        placeholder={selected ? '' : placeholder}
        value={showSelectedLabel ? labelOf(selected) : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIdx(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery('');
        }}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '9px 34px 9px 34px',
          borderRadius: '8px',
          border: '1px solid var(--border-strong, #D1D5DB)',
          backgroundColor: '#fff',
          fontSize: '13.5px',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <ChevronDown
        size={16}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 20,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            margin: 0,
            padding: '4px',
            listStyle: 'none',
            backgroundColor: '#fff',
            border: '1px solid var(--border-strong, #D1D5DB)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {flat.length === 0 && (
            <li style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              No players match “{query}”
            </li>
          )}
          {filteredGroups.map((g) => (
            <li key={g.label} role="presentation">
              <div style={{ padding: '6px 10px 2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                {g.label}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {g.members.map((p) => {
                  const idx = indexById.get(String(p.id));
                  const isActive = idx === activeIdx;
                  return (
                    <li
                      key={p.id}
                      id={`${listId}-${p.id}`}
                      role="option"
                      aria-selected={String(p.id) === String(value)}
                      onMouseDown={(e) => {
                        e.preventDefault(); // keep focus so blur doesn't close before click
                        choose(p);
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        backgroundColor: isActive ? '#F3EFE6' : 'transparent',
                        fontWeight: String(p.id) === String(value) ? 700 : 500,
                      }}
                    >
                      {labelOf(p)}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}