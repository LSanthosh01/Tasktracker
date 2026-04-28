import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const TaskModal = ({ task, users, onClose, onSave, currentUser }) => {
  const isEdit = !!task?._id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id || '',
    deadline: task?.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.assignedTo || !form.deadline) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/tasks/${task._id}`, form);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', form);
        toast.success('Task created');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  // Employee can only update status
  const isEmployee = currentUser.role === 'employee';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} disabled={isEmployee}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" value={form.description} disabled={isEmployee}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the task..." />
            </div>
            {!isEmployee && (
              <div className="form-group">
                <label className="form-label">Assign To *</label>
                <select className="form-select" value={form.assignedTo}
                  onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
                  <option value="">Select a person...</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
            )}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Deadline *</label>
                <input type="date" className="form-input" value={form.deadline} disabled={isEmployee}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} disabled={isEmployee}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const canCreate = user.role === 'admin' || user.role === 'manager';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);

      const [tasksRes] = await Promise.all([
        api.get(`/tasks?${params}`),
      ]);
      setTasks(tasksRes.data.tasks);

      if (canCreate) {
        const usersRes = await api.get('/users');
        const eligible = usersRes.data.users.filter(u =>
          user.role === 'admin' ? u.role !== 'admin' : u.role === 'employee'
        );
        setUsers(eligible);
      }
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, canCreate, user.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = tasks.filter(t =>
    !filters.search ||
    t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    t.description.toLowerCase().includes(filters.search.toLowerCase())
  );

  const isOverdue = (task) => new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      <div className="filters">
        <div className="search-input">
          <Search className="search-icon" />
          <input className="form-input" placeholder="Search tasks..."
            value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
        </div>
        <select className="filter-select" value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No tasks found</div>
            <div className="empty-desc">{canCreate ? 'Create your first task to get started' : 'No tasks assigned to you yet'}</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Assigned By</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task._id} style={isOverdue(task) ? { background: 'rgba(255,107,107,0.03)' } : {}}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {task.assignedTo?.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{task.assignedTo?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{task.assignedTo?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{task.assignedBy?.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <Calendar size={13} style={{ color: isOverdue(task) ? 'var(--danger)' : 'var(--text-muted)' }} />
                        <span style={{ color: isOverdue(task) ? 'var(--danger)' : 'inherit' }}>
                          {format(new Date(task.deadline), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(task)} title="Edit">
                          <Edit size={14} />
                        </button>
                        {(user.role === 'admin' || task.assignedBy?._id === user._id) && (
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(task._id)} title="Delete">
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
        <TaskModal
          task={modal === 'create' ? null : modal}
          users={users}
          onClose={() => setModal(null)}
          onSave={fetchData}
          currentUser={user}
        />
      )}
    </div>
  );
}
