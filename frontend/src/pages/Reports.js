import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';

const ReportModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    progressDescription: '',
    hoursWorked: 8,
    tasksWorkedOn: [],
    taggedTo: null,
    selfRating: 5
  });
  const [tasks, setTasks] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showTag, setShowTag] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/tasks?status=in-progress&limit=50').then(r => setTasks(r.data.tasks)).catch(() => {});
    api.get('/users/managers').then(r => setManagers(r.data.managers)).catch(() => {});
  }, []);

  const toggleTask = (taskId, title) => {
    setForm(p => {
      const exists = p.tasksWorkedOn.find(t => t.task === taskId);
      return {
        ...p,
        tasksWorkedOn: exists
          ? p.tasksWorkedOn.filter(t => t.task !== taskId)
          : [...p.tasksWorkedOn, { task: taskId, taskTitle: title }]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.progressDescription.trim()) return toast.error('Progress description is required');
    setLoading(true);
    try {
      await api.post('/reports', form);
      toast.success('Report submitted!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 className="modal-title">Submit Work Report</h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Report Date *</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hours Worked</label>
                <input type="number" className="form-input" value={form.hoursWorked} min={0} max={24}
                  onChange={e => setForm(p => ({ ...p, hoursWorked: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Self Rating (Stars)</label>
                <select className="form-select" value={form.selfRating}
                  onChange={e => setForm(p => ({ ...p, selfRating: Number(e.target.value) }))}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
            </div>
            {tasks.length > 0 && (
              <div className="form-group">
                <label className="form-label">Tasks Worked On</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {tasks.map(task => {
                    const selected = form.tasksWorkedOn.some(t => t.task === task._id);
                    return (
                      <label key={task._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: selected ? 'rgba(108,99,255,0.1)' : 'var(--bg-secondary)', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleTask(task._id, task.title)}
                          style={{ accentColor: 'var(--accent)' }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</span>
                        <span className={`badge badge-${task.status}`} style={{ marginLeft: 'auto' }}>{task.status}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Progress Description *</label>
              <textarea className="form-textarea" style={{ minHeight: 140 }}
                value={form.progressDescription} placeholder="Describe what you worked on today, any blockers, and progress made..."
                onChange={e => setForm(p => ({ ...p, progressDescription: e.target.value }))} />
            </div>
            <div className="form-group">
              <button type="button" className="btn btn-outline" onClick={() => setShowTag(!showTag)}>
                {form.taggedTo ? 'Tagged to Manager' : 'Tag Manager'}
              </button>
              {showTag && managers.length > 0 && (
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                  {managers.map(manager => (
                    <div key={manager._id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: form.taggedTo === manager._id ? 'rgba(108,99,255,0.1)' : 'transparent' }}
                      onClick={() => { setForm(p => ({ ...p, taggedTo: manager._id })); setShowTag(false); }}>
                      <p style={{ fontWeight: 500 }}>{manager.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{manager.email}</p>
                    </div>
                  ))}
                </div>
              )}
              {form.taggedTo && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(108,99,255,0.1)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{managers.find(m => m._id === form.taggedTo)?.name}</span>
                  <button type="button" onClick={() => setForm(p => ({ ...p, taggedTo: null }))} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>✕</button>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReportDetail = ({ report, onClose, onReview, currentUser }) => {
  // Managers' reports can only be reviewed by admin
  const isManagerReport = report.submittedBy?.role === 'manager';
  const canReview = isManagerReport
    ? currentUser.role === 'admin'
    : currentUser.role !== 'employee';
  const [reviewForm, setReviewForm] = useState({ status: 'reviewed', reviewNotes: '', managerRatingStars: 5 });

  const handleReview = async () => {
    try {
      await api.put(`/reports/${report._id}/review`, reviewForm);
      toast.success('Report reviewed');
      onReview();
      onClose();
    } catch (err) {
      toast.error('Failed to review report');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 className="modal-title">Work Report</h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm">✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Submitted By</p>
              <p style={{ fontWeight: 600 }}>{report.submittedBy?.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{report.submittedBy?.role}</p>
            </div>
            {report.taggedTo && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Tagged Manager</p>
                <p style={{ fontWeight: 600 }}>{report.taggedTo?.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{report.taggedTo?.role}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Date</p>
              <p style={{ fontWeight: 600 }}>{format(new Date(report.date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Hours</p>
              <p style={{ fontWeight: 600 }}>{report.hoursWorked}h</p>
            </div>
            <div>
              <span className={`badge badge-${report.status}`}>{report.status}</span>
            </div>
            {report.selfRating && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Self Rating</p>
                <p style={{ fontWeight: 600 }}>★ {report.selfRating}</p>
              </div>
            )}
            {report.managerRatingStars && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Manager Rating</p>
                <p style={{ fontWeight: 600 }}>★ {report.managerRatingStars}</p>
              </div>
            )}
          </div>

          {report.tasksWorkedOn?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TASKS WORKED ON</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {report.tasksWorkedOn.map((t, i) => (
                  <span key={i} className="chip">{t.taskTitle || t.task?.title || 'Task'}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>PROGRESS</p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8 }}>
              {report.progressDescription}
            </p>
          </div>

          {report.reviewedBy && (
            <div style={{ background: 'rgba(56, 217, 169, 0.08)', border: '1px solid rgba(56, 217, 169, 0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>Reviewed by {report.reviewedBy?.name}</p>
              {report.reviewNotes && <p style={{ fontSize: 13 }}>{report.reviewNotes}</p>}
            </div>
          )}

          {canReview && report.status === 'submitted' && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Review this report</p>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={reviewForm.status}
                    onChange={e => setReviewForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="reviewed">Mark as Reviewed</option>
                    <option value="approved">Mark as Approved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Manager Rating (Stars)</label>
                  <select className="form-select" value={reviewForm.managerRatingStars}
                    onChange={e => setReviewForm(p => ({ ...p, managerRatingStars: Number(e.target.value) }))}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <textarea className="form-textarea" style={{ minHeight: 80 }} placeholder="Add review notes (optional)..."
                  value={reviewForm.reviewNotes} onChange={e => setReviewForm(p => ({ ...p, reviewNotes: e.target.value }))} />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {canReview && report.status === 'submitted' && (
            <button className="btn btn-success" onClick={handleReview}>
              <CheckCircle size={15} /> Submit Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [filter, setFilter] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports?limit=50');
      setReports(res.data.reports);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = reports.filter(r => !filter || r.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Work Reports</h1>
          <p className="page-subtitle">{reports.length} report{reports.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user.role !== 'employee' && (
            <button className="btn btn-outline" onClick={() => {
              const data = reports.map(r => ({
                SubmittedBy: r.submittedBy?.name,
                Role: r.submittedBy?.role,
                Date: format(new Date(r.date), 'yyyy-MM-dd'),
                Hours: r.hoursWorked,
                SelfRating: r.selfRating,
                Status: r.status,
                ProgressDescription: r.progressDescription,
                ReviewedBy: r.reviewedBy?.name || '',
                ReviewNotes: r.reviewNotes || '',
                ManagerStars: r.managerRatingStars || ''
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
              XLSX.utils.book_append_sheet(wb, ws, "Reports");
              XLSX.writeFile(wb, "Reports_Export.xlsx");
            }}>
              Export to Excel
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Submit Report
          </button>
        </div>
      </div>

      <div className="filters">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No reports found</div>
            <div className="empty-desc">Submit your first daily work report</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Progress Summary</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>{filter === 'approved' ? 'Ratings' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(report => (
                  <tr key={report._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {report.submittedBy?.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{report.submittedBy?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{report.submittedBy?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{format(new Date(report.date), 'MMM d, yyyy')}</td>
                    <td style={{ fontSize: 13 }}>{report.hoursWorked}h</td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.progressDescription}
                      </div>
                    </td>
                    <td><span className={`badge badge-${report.status}`}>{report.status}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{report.reviewedBy?.name || '—'}</td>
                    <td>
                      {report.status !== 'approved' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setViewReport(report)} title="View">
                            <Eye size={14} />
                          </button>
                          {(user.role === 'admin' || report.submittedBy?._id === user._id) && (
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(report._id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {report.managerRatingStars ? `★ ${report.managerRatingStars}/5` : <span style={{ color: 'var(--text-muted)' }}>No Rating</span>}
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

      {showCreate && <ReportModal onClose={() => setShowCreate(false)} onSave={fetchReports} />}
      {viewReport && (
        <ReportDetail report={viewReport} onClose={() => setViewReport(null)} onReview={fetchReports} currentUser={user} />
      )}
    </div>
  );
}
