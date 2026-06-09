import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, FileText, Star, Users,
  User, LogOut, Zap, Shield, Briefcase, UserCheck
} from 'lucide-react';
import photo from '../../assets/ph1.jpeg';
import PhotoSliderModal from './PhotoSliderModal';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'employee'] },
  { path: '/reports', label: 'Work Reports', icon: FileText, roles: ['admin', 'manager', 'employee'] },
  { path: '/users', label: 'User Management', icon: Users, roles: ['admin', 'manager'] },
];

const ROLE_ICON = { admin: Shield, manager: Briefcase, employee: UserCheck };

export default function Layout() {
  const { user, logout, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sliderOpen, setSliderOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const RoleIcon = ROLE_ICON[user?.role] || User;
  const pageName = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || 'Profile';

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">TaskTrack</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Navigation</span>
          {NAV_ITEMS
            .filter(item => item.roles.includes(user?.role))
            .map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  {item.label}
                </NavLink>
              );
            })}

          <span className="nav-section-label" style={{ marginTop: 8 }}>Account</span>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User className="nav-icon" />
            My Profile
          </NavLink>
          <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut className="nav-icon" />
            Sign Out
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              <span className={`role-dot ${user?.role}`} />
              {user?.role}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="header">
          <div>
            <div className="header-title">{pageName}</div>
          </div>
          <div className="header-actions">
            <NotificationBell />
            <div className="header-divider" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <RoleIcon size={15} />
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user?.role}</span>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
        <footer style={{
          textAlign: 'right',
          padding: '16px 32px',
          color: 'var(--text-secondary)',
          background: '#ffffff',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Naveen Lawrence</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Technical Trainer &mdash; Magic Bus India Organisation</div>
          </div>
          <img
            src={photo}
            alt="Naveen Lawrence"
            onClick={() => setSliderOpen(true)}
            title="View photos"
            style={{
              width: '55px', height: '55px', borderRadius: '12px',
              objectFit: 'cover', border: '3px solid var(--accent-4)',
              boxShadow: '0 2px 10px rgba(79,70,229,0.15)',
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(108,99,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow='0 2px 10px rgba(79,70,229,0.15)'; }}
          />
        </footer>
        <PhotoSliderModal isOpen={sliderOpen} onClose={() => setSliderOpen(false)} startIndex={0} />
      </div>
    </div>
  );
}
