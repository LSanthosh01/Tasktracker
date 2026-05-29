import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import { Bell, AlertTriangle, Clock, X, CheckCircle } from 'lucide-react';
import { format, differenceInHours, differenceInDays, isPast } from 'date-fns';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('tasktrack_dismissed_notifs') || '[]');
    } catch { return []; }
  });
  const ref = useRef(null);

  const computeNotifications = useCallback((tasks) => {
    const now = new Date();
    const notifs = [];

    tasks.forEach(task => {
      if (task.status === 'completed') return;

      const deadline = new Date(task.deadline);
      const hoursUntil = differenceInHours(deadline, now);
      const daysUntil = differenceInDays(deadline, now);
      const overdue = isPast(deadline);

      if (overdue) {
        notifs.push({
          id: `overdue-${task._id}`,
          taskId: task._id,
          title: task.title,
          deadline: task.deadline,
          type: 'overdue',
          urgency: 'critical',
          message: `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`,
          icon: AlertTriangle,
          color: '#ef4444'
        });
      } else if (hoursUntil <= 48) {
        const isUrgent = hoursUntil <= 24;
        notifs.push({
          id: `approaching-${task._id}`,
          taskId: task._id,
          title: task.title,
          deadline: task.deadline,
          type: 'approaching',
          urgency: isUrgent ? 'high' : 'medium',
          message: hoursUntil <= 1
            ? 'Due in less than 1 hour!'
            : hoursUntil <= 24
              ? `Due in ${Math.ceil(hoursUntil)} hour${Math.ceil(hoursUntil) !== 1 ? 's' : ''}`
              : `Due in ${Math.ceil(daysUntil)} day${Math.ceil(daysUntil) !== 1 ? 's' : ''}`,
          icon: Clock,
          color: isUrgent ? '#f59e0b' : '#3b82f6'
        });
      }
    });

    // Sort: overdue first, then by deadline ascending
    notifs.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    return notifs;
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/tasks?limit=100');
      const tasks = res.data.tasks || [];
      setNotifications(computeNotifications(tasks));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [computeNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDismiss = (notifId, e) => {
    e.stopPropagation();
    const updated = [...dismissed, notifId];
    setDismissed(updated);
    sessionStorage.setItem('tasktrack_dismissed_notifs', JSON.stringify(updated));
  };

  const activeNotifs = notifications.filter(n => !dismissed.includes(n.id));
  const count = activeNotifs.length;

  return (
    <div className="notif-bell-container" ref={ref}>
      <button
        className={`notif-bell-btn ${count > 0 ? 'has-notifications' : ''}`}
        onClick={() => setOpen(!open)}
        title={`${count} notification${count !== 1 ? 's' : ''}`}
        id="notification-bell"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="notif-badge">{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <h4>Notifications</h4>
            <span className="notif-count-label">{count} alert{count !== 1 ? 's' : ''}</span>
          </div>

          <div className="notif-dropdown-body">
            {activeNotifs.length === 0 ? (
              <div className="notif-empty">
                <CheckCircle size={32} style={{ color: 'var(--success)', opacity: 0.5 }} />
                <p>All caught up!</p>
                <span>No upcoming deadlines</span>
              </div>
            ) : (
              activeNotifs.map(notif => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`notif-item notif-${notif.urgency}`}
                  >
                    <div className="notif-item-icon" style={{ color: notif.color }}>
                      <Icon size={18} />
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-title">{notif.title}</div>
                      <div className="notif-item-meta">
                        <span className={`notif-urgency-tag notif-urgency-${notif.urgency}`}>
                          {notif.type === 'overdue' ? 'OVERDUE' : 'APPROACHING'}
                        </span>
                        <span className="notif-item-message">{notif.message}</span>
                      </div>
                      <div className="notif-item-deadline">
                        Due: {format(new Date(notif.deadline), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <button
                      className="notif-dismiss-btn"
                      onClick={(e) => handleDismiss(notif.id, e)}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {activeNotifs.length > 0 && (
            <div className="notif-dropdown-footer">
              <button
                className="notif-clear-all"
                onClick={() => {
                  const allIds = activeNotifs.map(n => n.id);
                  const updated = [...dismissed, ...allIds];
                  setDismissed(updated);
                  sessionStorage.setItem('tasktrack_dismissed_notifs', JSON.stringify(updated));
                }}
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
