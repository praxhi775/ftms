import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { 
  Home, 
  Users, 
  Trophy, 
  BarChart2, 
  HardDrive,
  LogOut
} from 'lucide-react';
import AppLogo from '../common/AppLogo';

export default function Header() {
  const { logout } = useAuth();
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/players', label: 'Squad Roster', icon: Users },
    { to: '/sessions', label: 'Sessions', icon: Trophy },
    { to: '/stats', label: 'Stats', icon: BarChart2 },
    { to: '/backup', label: 'Backup', icon: HardDrive },
  ];

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <div className="mobile-brand">
          <AppLogo size={36} />
          <div>
            <h1 className="mobile-brand-title">FTMS</h1>
            <span className="mobile-brand-subtitle">Sunday Squad notebook</span>
          </div>
        </div>

        <div className="mobile-header-actions">
          <div className="squad-status-indicator mobile-status">
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-label">Pitch Ready</span>
          </div>
          <button type="button" className="account-logout" onClick={logout} aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
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
