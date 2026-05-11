import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import photo from '../assets/photo.jpeg';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', adminSecret: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.adminSecret) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Admin account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left — background image with brand overlay */}
      <div className="auth-bg">
        <div className="auth-bg-brand">
          <h2>Manage tasks.<br />Deliver results.</h2>
          <p>A smarter way to track work, collaborate with your team, and hit every deadline — all in one place.</p>
        </div>
      </div>

      {/* Right — register panel */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-icon" style={{ width: 42, height: 42, fontSize: 22, background: 'linear-gradient(135deg, #6c63ff, #ff6584)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
            <span className="logo-text" style={{ fontSize: 24 }}>TaskFlow</span>
          </div>
          <h1 className="auth-title">Create Admin</h1>
          <p className="auth-subtitle">Register the initial admin account for your organization</p>

          <div className="alert alert-info">
            <span>This registers an admin account. You'll need the admin secret key.</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="John Doe"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="admin@company.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Secret</label>
              <input type="password" className="form-input" placeholder="Admin registration key"
                value={form.adminSecret} onChange={e => setForm(p => ({ ...p, adminSecret: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={photo} alt="Naveen Lawrence" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Naveen Lawrence</span>
            </div>
            <span>Technical Trainer &mdash; Magic Bus India Organisation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
