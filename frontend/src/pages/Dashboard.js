import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { CheckSquare, Clock, CheckCircle, Users, FileText, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="stat-card" style={{ '--stat-color': color }}>
    <div className="stat-icon"><Icon size={20} /></div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [stats, setStats] = useState({ tasks: [], users: [], reports: [], ratings: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const requests = [api.get('/tasks?limit=100')];
        if (!isEmployee) requests.push(api.get('/users'));
        requests.push(api.get('/reports?limit=100'));

        const [tasksRes, ...rest] = await Promise.allSettled(requests);
        const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data.tasks : [];
        let usersData = [], reportsData = [];

        if (!isEmployee && rest[0]?.status === 'fulfilled') {
          usersData = rest[0].value.data.users || [];
          reportsData = rest[1]?.value?.data?.reports || [];
        } else {
          reportsData = rest[0]?.value?.data?.reports || [];
        }

        setStats({ tasks, users: usersData, reports: reportsData });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isEmployee, isAdmin]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  );

  const { tasks, users, reports } = stats;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  const selfRatings = [
    ...tasks.filter(t => t.selfRating).map(t => t.selfRating),
    ...reports.filter(r => r.selfRating).map(r => r.selfRating)
  ];
  const avgSelfRating = selfRatings.length
    ? (selfRatings.reduce((s, r) => s + r, 0) / selfRatings.length).toFixed(1)
    : 'N/A';

  const managerRatings = tasks.filter(t => t.managerRatingStars).map(t => t.managerRatingStars);
  const avgManagerRating = managerRatings.length
    ? (managerRatings.reduce((s, r) => s + r, 0) / managerRatings.length).toFixed(1)
    : 'N/A';

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff', textShadow: '1px 2px 8px rgba(0,0,0,0.7)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle" style={{ color: '#f8fafc', textShadow: '1px 1px 4px rgba(0,0,0,0.8)', fontWeight: 500, marginTop: '4px' }}>
            {format(new Date(), 'EEEE, MMMM d yyyy')} · Here's what's happening today
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tasks" value={tasks.length} icon={CheckSquare} color="#6c63ff" />
        <StatCard label="Pending" value={pendingTasks} icon={Clock} color="#f7971e" />
        <StatCard label="In Progress" value={inProgressTasks} icon={TrendingUp} color="#74c0fc" />
        <StatCard label="Completed" value={completedTasks} icon={CheckCircle} color="#38d9a9" />
        {!isEmployee && <StatCard label="Team Members" value={users.length} icon={Users} color="#ff6584" />}
        {!isAdmin && <StatCard label="Ratings" value={avgManagerRating} icon={Star} color="#fcc419" sub={`${managerRatings.length} rating${managerRatings.length !== 1 ? 's' : ''}`} />}
        <StatCard label="Reports" value={reports.length} icon={FileText} color="#43e97b" />
        {overdueTasks > 0 && <StatCard label="Overdue" value={overdueTasks} icon={AlertCircle} color="#ff6b6b" sub="Need attention" />}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tasks</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tasks.length} total</span>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-icon">📋</div>
              <div className="empty-title">No tasks yet</div>
            </div>
          ) : (
            <div className="scroll-list">
              {recentTasks.map(task => (
                <div key={task._id} className="list-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Due {format(new Date(task.deadline), 'MMM d, yyyy')} ·{' '}
                      {task.assignedTo?.name || 'Unassigned'}
                    </div>
                  </div>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Reports</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{reports.length} total</span>
          </div>
          {recentReports.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-icon">📝</div>
              <div className="empty-title">No reports yet</div>
            </div>
          ) : (
            <div className="scroll-list">
              {recentReports.map(report => (
                <div key={report._id} className="list-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                      {report.submittedBy?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {report.progressDescription?.slice(0, 60)}...
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge badge-${report.status}`}>{report.status}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {format(new Date(report.date), 'MMM d')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task completion progress */}
      {tasks.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Task Completion Overview</h3>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
              {Math.round((completedTasks / tasks.length) * 100)}% Done
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Completed', count: completedTasks, color: 'var(--success)' },
              { label: 'In Progress', count: inProgressTasks, color: 'var(--accent)' },
              { label: 'Pending', count: pendingTasks, color: 'var(--accent-4)' },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"
                    style={{ width: `${tasks.length ? (count / tasks.length) * 100 : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
