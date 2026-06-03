import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Calendar, User, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';

const STATUS_OPTIONS = ['pending', 'in-progress', 'under-review', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

// ─── Multi-Select Dropdown ────────────────────────────────────────────────────
const MultiSelectDropdown = ({ users, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };

  const selectedNames = users.filter(u => selectedIds.includes(u._id)).map(u => u.name);

  return (
    <div className="multi-select-dropdown" ref={ref}>
      <div className="multi-select-trigger" onClick={() => setOpen(!open)}>
        <div className="multi-select-tags">
          {selectedNames.length === 0 && <span className="multi-select-placeholder">Select employees...</span>}
          {selectedNames.map((name, i) => (
            <span key={i} className="multi-select-tag">
              {name}
              <X size={12} onClick={(e) => { e.stopPropagation(); toggle(users.find(u => u.name === name)?._id); }} />
            </span>
          ))}
        </div>
        <ChevronDown size={16} className={`multi-select-chevron ${open ? 'rotate' : ''}`} />
      </div>
      {open && (
        <div className="multi-select-menu">
          <input
            className="multi-select-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="multi-select-options">
            {filtered.length === 0 ? (
              <div className="multi-select-empty">No matches</div>
            ) : filtered.map(u => (
              <label key={u._id} className={`multi-select-option ${selectedIds.includes(u._id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u._id)}
                  onChange={() => toggle(u._id)}
                />
                <span className="multi-select-option-name">{u.name}</span>
                <span className="multi-select-option-role">{u.role}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



// ─── Task Create / Edit Modal ─────────────────────────────────────────────────
const TaskModal = ({ task, users, onClose, onSave, currentUser }) => {
  const isEdit = !!task?._id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id ? [task.assignedTo._id] : [],
    deadline: task?.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    selfRating: task?.selfRating || 5
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || form.assignedTo.length === 0 || !form.deadline) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      if (isEdit) {
        // For employees: 'completed' in dropdown maps to 'under-review' on backend
        const submitForm = { ...form, assignedTo: form.assignedTo[0] };
        if (isEmployee && submitForm.status === 'completed') {
          submitForm.status = 'under-review';
        }
        await api.put(`/tasks/${task._id}`, submitForm);
        if (isEmployee && form.status === 'completed') {
          toast.success('Task submitted for approval');
        } else {
          toast.success('Task updated');
        }
      } else {
        // Create mode: supports multi-assign
        const payload = {
          ...form,
          assignedTo: form.assignedTo.length === 1 ? form.assignedTo[0] : form.assignedTo
        };
        const res = await api.post('/tasks', payload);
        if (res.data.count && res.data.count > 1) {
          toast.success(`Task assigned to ${res.data.count} employees`);
        } else {
          toast.success('Task created');
        }
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
                <label className="form-label">
                  Assign To * {!isEdit && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>(select multiple to assign to each)</span>}
                </label>
                {isEdit ? (
                  <select className="form-select" value={form.assignedTo[0] || ''}
                    onChange={e => setForm(p => ({ ...p, assignedTo: [e.target.value] }))}>
                    <option value="">Select a person...</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                  </select>
                ) : (
                  <MultiSelectDropdown
                    users={users}
                    selectedIds={form.assignedTo}
                    onChange={(ids) => setForm(p => ({ ...p, assignedTo: ids }))}
                  />
                )}
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
              <>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {(isEmployee
                      ? STATUS_OPTIONS.filter(s => s !== 'under-review') // employees see 'completed' instead of 'under-review'
                      : STATUS_OPTIONS
                    ).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {form.status === 'completed' && isEmployee && (
                  <>
                    <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                      ⚠️ This task will be sent to <strong>{task?.assignedBy?.name}</strong> for review and approval.
                    </div>
                    <div className="form-group">
                      <label className="form-label">Self Rating (Stars)</label>
                      <select className="form-select" value={form.selfRating}
                        onChange={e => setForm(p => ({ ...p, selfRating: Number(e.target.value) }))}>
                        {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Task' : `Create Task${form.assignedTo.length > 1 ? ` (${form.assignedTo.length} employees)` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Review Modal (Manager / Admin) ──────────────────────────────────────────
const ReviewModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({ managerRatingStars: 5, managerRatingPercentage: 100, reviewNotes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/tasks/${task._id}/review`, form);
      toast.success('Task approved and completed');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Review & Approve Task</h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{task.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                Submitted by: {task.assignedTo?.name}
              </div>
              {task.selfRating !== undefined && task.selfRating !== null && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Self Rating: {'★'.repeat(task.selfRating)}{'☆'.repeat(5 - task.selfRating)} ({task.selfRating}/5)
                </div>
              )}
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Rating (Stars)</label>
                <select className="form-select" value={form.managerRatingStars}
                  onChange={e => setForm(p => ({ ...p, managerRatingStars: Number(e.target.value) }))}>
                  {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rating (%)</label>
                <input type="number" className="form-input" min="0" max="100" value={form.managerRatingPercentage}
                  onChange={e => setForm(p => ({ ...p, managerRatingPercentage: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Review Notes</label>
              <textarea className="form-textarea" value={form.reviewNotes}
                onChange={e => setForm(p => ({ ...p, reviewNotes: e.target.value }))} placeholder="Add feedback..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Processing...' : 'Approve Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Tasks Page ──────────────────────────────────────────────────────────
export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [reviewModal, setReviewModal] = useState(null); // task object

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
          user.role === 'admin' ? u.role === 'manager' : u.role === 'employee'
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

  const filtered = tasks.filter(t => {
    const matchesSearch = !filters.search ||
      t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      t.description.toLowerCase().includes(filters.search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (user.role === 'admin') {
      return t.assignedTo?.role === 'manager';
    }
    return true;
  });

  const isOverdue = (task) => new Date(task.deadline) < new Date() && task.status !== 'completed';

  const getStatusLabel = (status) => {
    if (status === 'under-review') return 'Pending Approval';
    return status;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {canCreate && (
            <button className="btn btn-outline" onClick={() => {
              const exportTasks = tasks.filter(t => {
                if (filters.status && t.status !== filters.status) return false;
                if (filters.priority && t.priority !== filters.priority) return false;
                if (filters.search &&
                  !t.title.toLowerCase().includes(filters.search.toLowerCase()) &&
                  !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
                return true;
              });
              const data = exportTasks.map(t => ({
                Title: t.title,
                Description: t.description,
                AssignedTo: t.assignedTo?.name,
                AssignedBy: t.assignedBy?.name,
                Deadline: format(new Date(t.deadline), 'yyyy-MM-dd'),
                Status: t.status,
                Priority: t.priority,
                SelfRating: t.selfRating,
                'Admin/Manager Stars': t.managerRatingStars,
                'Admin/Manager Percentage': t.managerRatingPercentage
              }));
              const ws = XLSX.utils.json_to_sheet(data);
              
              const range = XLSX.utils.decode_range(ws['!ref']);
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: 0, c: C });
                if (!ws[address]) continue;
                ws[address].s = {
                  font: { bold: true },
                  alignment: { horizontal: 'left' }
                };
              }
              // Set column widths
              ws['!cols'] = Object.keys(data[0]).map(() => ({ wch: 20 }));

              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Tasks");
              XLSX.writeFile(wb, "Tasks_Export.xlsx");
            }}>
              Export to Excel
            </button>
          )}
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setModal('create')}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
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
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
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
                  <th>{filters.status === 'completed' ? 'Ratings' : 'Actions'}</th>
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
                    <td><span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {/* Manager/Admin: Review button for under-review tasks */}
                        {(user.role === 'admin' || (user.role === 'manager' && task.assignedBy?._id === user._id)) && task.status === 'under-review' && (
                          <button className="btn btn-success btn-sm" onClick={() => setReviewModal(task)}>
                            Review
                          </button>
                        )}
                        {/* Edit button (hide for employees on completed tasks) */}
                        {!(user.role === 'employee' && task.status === 'completed') && (
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(task)} title="Edit">
                            <Edit size={14} />
                          </button>
                        )}
                        {/* Delete button */}
                        {(user.role === 'admin' || task.assignedBy?._id === user._id) && (
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(task._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      {task.status === 'completed' && task.managerRatingStars !== undefined && task.managerRatingStars !== null && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          ★ {task.managerRatingStars}/5 • {task.managerRatingPercentage}%
                        </div>
                      )}
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
      {reviewModal && (
        <ReviewModal
          task={reviewModal}
          onClose={() => setReviewModal(null)}
          onSave={fetchData}
        />
      )}

    </div>
  );
}
