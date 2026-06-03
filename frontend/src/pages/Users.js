import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, UserCheck, Search, Edit } from 'lucide-react';
import { format } from 'date-fns';

const UserModal = ({ user: editUser, currentUser, onClose, onSave }) => {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'employee',
    department: editUser?.department || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!isEdit && !form.password) return toast.error('Password is required');
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/users/${editUser._id}`, { name: form.name, department: form.department });
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const allowedRoles = currentUser.role === 'admin'
    ? ['manager', 'employee']
    : ['employee'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} placeholder="John Doe"
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} placeholder="john@example.com"
                disabled={isEdit}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" value={form.password} placeholder="Min 6 characters"
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
            )}
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {allowedRoles.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{!isEdit && form.role === 'manager' ? 'Project' : 'Department'}</label>
              <input className="form-input" value={form.department}
                placeholder={!isEdit && form.role === 'manager' ? 'Project name or code' : 'Engineering, Design, etc.'}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ admin: 0, manager: 0, employee: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await api.get('/users');
      const fetchedUsers = usersRes.data.users;
      setUsers(fetchedUsers);
      
      // Calculate stats locally from the fetched list so it exactly matches what's visible
      setStats({
        admin: fetchedUsers.filter(u => u.role === 'admin').length,
        manager: fetchedUsers.filter(u => u.role === 'manager').length,
        employee: fetchedUsers.filter(u => u.role === 'employee').length,
        total: fetchedUsers.length
      });
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{stats.total} total members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Role summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          ...(user.role === 'admin' ? [
            { role: 'admin', color: 'var(--accent-2)', count: stats.admin },
            { role: 'manager', color: 'var(--accent)', count: stats.manager }
          ] : []),
          { role: 'employee', color: 'var(--accent-3)', count: stats.employee },
        ].map(({ role, color, count }) => (
          <div key={role} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}s</div>
            </div>
          </div>
        ))}
      </div>

      <div className="filters">
        <div className="search-input" style={{ flex: 1, maxWidth: 320 }}>
          <Search className="search-icon" />
          <input className="form-input" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: '#ffffff', border: '1px solid #d1d5db' }} />
        </div>
        {user.role === 'admin' && (
          <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No users found</div>
            <div className="empty-desc">Create your first team member</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} style={!u.isActive ? { opacity: 0.5 } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.isActive ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(u)} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-icon btn-sm ${u.isActive ? 'btn-secondary' : 'btn-success'}`}
                          onClick={() => handleToggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                          <UserCheck size={14} />
                        </button>
                        {/* Managers cannot delete admins — only employees */}
                        {!(user.role === 'manager' && u.role === 'admin') && (
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(u._id, u.name)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          currentUser={user}
          onClose={() => setModal(null)}
          onSave={fetchUsers}
        />
      )}
    </div>
  );
}
