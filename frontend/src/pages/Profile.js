import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Shield, Briefcase, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_ICONS = { admin: Shield, manager: Briefcase, employee: UserCheck };
const ROLE_COLORS = { admin: 'var(--accent-2)', manager: 'var(--accent)', employee: 'var(--accent-3)' };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', department: user?.department || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put(`/users/${user._id}`, profileForm);
      updateUser({ ...user, ...res.data.user });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const RoleIcon = ROLE_ICONS[user?.role] || User;
  const roleColor = ROLE_COLORS[user?.role] || 'var(--accent)';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Profile card */}
        <div className="card" style={{ textAlign: 'center', position: 'sticky', top: 80 }}>
          <div style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${roleColor}, var(--accent))`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'white', margin: '0 auto 16px' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{user?.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{user?.email}</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <span className={`badge badge-${user?.role}`}>
              <RoleIcon size={11} style={{ marginRight: 4 }} />
              {user?.role}
            </span>
          </div>
          {user?.department && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: 8 }}>
              🏢 {user.department}
            </p>
          )}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Member since</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : '—'}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginTop: 5 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active account</span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Edit profile */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} style={{ color: 'var(--accent)' }} /> Personal Information
              </h3>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={profileForm.department}
                  placeholder="e.g. Engineering, Marketing, Design..."
                  onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input className="form-input" value={user?.role} disabled style={{ opacity: 0.6, textTransform: 'capitalize' }} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Roles can only be changed by administrators</p>
              </div>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} style={{ color: 'var(--accent-2)' }} /> Change Password
              </h3>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={pwForm.currentPassword}
                  placeholder="Enter current password"
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={pwForm.newPassword}
                    placeholder="Min 6 characters"
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-input" value={pwForm.confirm}
                    placeholder="Repeat new password"
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
              {pwForm.newPassword && pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
                <p className="form-error" style={{ marginBottom: 12 }}>Passwords do not match</p>
              )}
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Role permissions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RoleIcon size={18} style={{ color: roleColor }} /> Your Permissions
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'View Dashboard', allowed: true },
                { label: 'View & Update Tasks', allowed: true },
                { label: 'Create Tasks', allowed: user?.role !== 'employee' },
                { label: 'Delete Tasks', allowed: user?.role !== 'employee' },
                { label: 'Submit Reports', allowed: true },
                { label: 'Review Reports', allowed: user?.role !== 'employee' },
                { label: 'Manage Users', allowed: user?.role !== 'employee' },
                { label: 'Delete Users', allowed: user?.role !== 'employee' },
                { label: 'Create Managers', allowed: user?.role === 'admin' },
                { label: 'View All Reports', allowed: user?.role !== 'employee' },
                { label: 'Give Ratings', allowed: true },
                { label: 'View All Ratings', allowed: true },
              ].map(({ label, allowed }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 13 }}>
                  <span style={{ fontSize: 14 }}>{allowed ? '✅' : '🚫'}</span>
                  <span style={{ color: allowed ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
