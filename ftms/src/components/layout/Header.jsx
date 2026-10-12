import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Trophy, 
  BarChart2, 
  HardDrive 
} from 'lucide-react';

export default function Header() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/players', label: 'Players', icon: Users },
    { to: '/matches', label: 'Matches', icon: Trophy },
    { to: '/stats', label: 'Stats', icon: BarChart2 },
    { to: '/backup', label: 'Backup', icon: HardDrive },
  ];

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <div className="mobile-brand">
          <div className="brand-icon-box" aria-hidden="true">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <circle cx="11" cy="15" r="2" />
            </svg>
          </div>
          <div>
            <h1 className="mobile-brand-title">Team Manager</h1>
            <span className="mobile-brand-subtitle">Sunday Squad notebook</span>
          </div>
        </div>

        <div className="squad-status-indicator mobile-status">
          <span className="status-dot" aria-hidden="true"></span>
          <span className="status-label">Pitch Ready</span>
        </div>
      </div>

      <nav className="mobile-nav" aria-label="Mobile Navigation">
        <div className="mobile-nav-scroll">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
