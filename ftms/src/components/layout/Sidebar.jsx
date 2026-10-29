import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Trophy, 
  BarChart2, 
  HardDrive 
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/players', label: 'Squad Roster', icon: Users },
    { to: '/sessions', label: 'Sessions', icon: Trophy },
    { to: '/stats', label: 'Stats', icon: BarChart2 },
    { to: '/backup', label: 'Backup', icon: HardDrive },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box" aria-hidden="true">
          {/* Tactical notebook / pitch logo */}
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="brand-svg"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
            <circle cx="11" cy="15" r="2" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-title">Team Manager</span>
          <span className="brand-subtitle">Sunday Squad notebook</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="nav-icon" size={18} strokeWidth={2.2} />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Local Storage Indicator */}
      <div className="sidebar-footer">
        <div className="local-storage-card">
          <div className="storage-status-row">
            <span className="storage-dot" aria-hidden="true"></span>
            <span className="storage-title">Local storage</span>
          </div>
          <p className="storage-desc">Saved in this browser only</p>
        </div>
      </div>
    </aside>
  );
}