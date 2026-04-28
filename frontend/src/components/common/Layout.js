import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, FileText, Star, Users,
  User, LogOut, Zap, Shield, Briefcase, UserCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'employee'] },
  { path: '/reports', label: 'Work Reports', icon: FileText, roles: ['admin', 'manager', 'employee'] },
  { path: '/ratings', label: 'Ratings', icon: Star, roles: ['admin', 'manager', 'employee'] },
  { path: '/users', label: 'User Management', icon: Users, roles: ['admin', 'manager'] },
];

const ROLE_ICON = { admin: Shield, manager: Briefcase, employee: UserCheck };

export default function Layout() {
  const { user, logout, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <RoleIcon size={15} />
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user?.role}</span>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
