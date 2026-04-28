import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Star, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const StarRating = ({ value, onChange, size = 24 }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`star ${s <= (hovered || value) ? 'active' : ''}`}
          style={{ fontSize: size, cursor: onChange ? 'pointer' : 'default' }}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(s)}
        >★</span>
      ))}
    </div>
  );
};

const RatingModal = ({ users, onClose, onSave }) => {
  const [form, setForm] = useState({ ratedUser: '', score: 0, feedback: '', category: 'overall' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ratedUser) return toast.error('Select a user to rate');
    if (!form.score) return toast.error('Please give a rating');
    setLoading(true);
    try {
      await api.post('/ratings', form);
      toast.success('Rating submitted!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = ['overall', 'performance', 'teamwork', 'communication', 'technical'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Give Rating</h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon btn-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Rate User *</label>
              <select className="form-select" value={form.ratedUser}
                onChange={e => setForm(p => ({ ...p, ratedUser: e.target.value }))}>
                <option value="">Select a user...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rating *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <StarRating value={form.score} onChange={s => setForm(p => ({ ...p, score: s }))} size={32} />
                {form.score > 0 && (
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][form.score]}
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Feedback (optional)</label>
              <textarea className="form-textarea" value={form.feedback}
                placeholder="Share your feedback about this person's performance..."
                onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !form.score}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserRatingCard = ({ userData }) => {
  const avgScore = userData.avgScore || 0;
  const filledStars = Math.round(avgScore);

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: 'radial-gradient(circle at top right, rgba(108,99,255,0.08), transparent)',
        borderRadius: '0 var(--radius) 0 80px'
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 18, flexShrink: 0 }}>
          {userData.user?.name?.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{userData.user?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            <span className={`role-dot ${userData.user?.role}`} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 4 }} />
            {userData.user?.role}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: avgScore >= 4 ? 'var(--success)' : avgScore >= 3 ? 'var(--warning)' : 'var(--danger)' }}>
            {avgScore.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{userData.totalRatings} rating{userData.totalRatings !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <StarRating value={filledStars} size={18} />
      <div className="progress-bar" style={{ marginTop: 12 }}>
        <div className="progress-fill" style={{ width: `${(avgScore / 5) * 100}%` }} />
      </div>
    </div>
  );
};

export default function Ratings() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, myRes] = await Promise.all([
        api.get('/ratings/summary'),
        api.get(`/ratings?userId=${user._id}`)
      ]);
      setSummary(summaryRes.data.summary || []);
      setMyRatings(myRes.data.ratings || []);

      if (user.role !== 'employee') {
        const usersRes = await api.get('/users');
        setAllUsers(usersRes.data.users.filter(u => u._id !== user._id));
      } else {
        // Employee can rate others from all users - get summary users
        const seen = new Set();
        const others = summaryRes.data.summary.map(s => s.user).filter(u => {
          if (!u || seen.has(u._id) || u._id === user._id) return false;
          seen.add(u._id);
          return true;
        });
        setAllUsers(others);
      }
    } catch (err) {
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }, [user._id, user.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const myAvg = myRatings.length
    ? (myRatings.reduce((s, r) => s + r.score, 0) / myRatings.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ratings</h1>
          <p className="page-subtitle">Performance ratings and feedback</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Give Rating
        </button>
      </div>

      {/* My rating summary */}
      {myRatings.length > 0 && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(255,101,132,0.05))', border: '1px solid rgba(108,99,255,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>MY AVERAGE RATING</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{myAvg}</span>
                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/5</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <StarRating value={Math.round(myAvg)} size={28} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                Based on {myRatings.length} rating{myRatings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {['overall', 'performance', 'teamwork'].map(cat => {
                const catRatings = myRatings.filter(r => r.category === cat);
                if (!catRatings.length) return null;
                const avg = (catRatings.reduce((s, r) => s + r.score, 0) / catRatings.length).toFixed(1);
                return (
                  <div key={cat} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{avg}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cat}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <>
          {summary.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> Team Leaderboard
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {summary.map(item => <UserRatingCard key={item._id} userData={item} />)}
              </div>
            </div>
          )}

          {myRatings.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>My Received Ratings</h2>
              <div className="card" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Category</th>
                      <th>Rating</th>
                      <th>Feedback</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRatings.map(rating => (
                      <tr key={rating._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                              {rating.ratedBy?.name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{rating.ratedBy?.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{rating.ratedBy?.role}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ textTransform: 'capitalize', fontSize: 13 }}>{rating.category}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StarRating value={rating.score} size={14} />
                            <span style={{ fontWeight: 700 }}>{rating.score}/5</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260 }}>
                          {rating.feedback || <span style={{ color: 'var(--text-muted)' }}>No feedback</span>}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rating.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary.length === 0 && myRatings.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <div className="empty-title">No ratings yet</div>
                <div className="empty-desc">Be the first to rate a team member's performance</div>
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <RatingModal
          users={allUsers}
          onClose={() => setShowCreate(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}
