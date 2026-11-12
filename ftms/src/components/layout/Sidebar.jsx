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

export default function Sidebar() {
  const { profile, user, logout } = useAuth();
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
        <AppLogo size={38} />
        <div className="brand-text">
          <span className="brand-title">FTMS</span>
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

      {/* Bottom: account + local storage indicator */}
      <div className="sidebar-footer">
        <div className="account-card">
          <div className="account-text">
            <span className="account-name">{profile?.name || user?.displayName || 'Manager'}</span>
            <span className="account-email">{user?.email}</span>
          </div>
          <button type="button" className="account-logout" onClick={logout} aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
        </div>

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
