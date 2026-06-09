import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import photo from '../assets/ph1.jpeg';
import PhotoSliderModal from '../components/common/PhotoSliderModal';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sliderOpen, setSliderOpen] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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

      {/* Right — login panel */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-icon" style={{ width: 42, height: 42, fontSize: 22, background: 'linear-gradient(135deg, #6c63ff, #ff6584)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
            <span className="logo-text" style={{ fontSize: 24 }}>TaskTracker</span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email" className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Need admin access?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Register here
            </Link>
          </p>

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={photo}
                alt="Naveen Lawrence"
                onClick={() => setSliderOpen(true)}
                title="View photos"
                style={{
                  width: '55px', height: '55px', borderRadius: '12px',
                  objectFit: 'cover', border: '3px solid white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(108,99,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.15)'; }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Naveen Lawrence</span>
            </div>
            <span>Technical Trainer &mdash; Magic Bus India Organisation</span>
          </div>
          <PhotoSliderModal isOpen={sliderOpen} onClose={() => setSliderOpen(false)} startIndex={0} />
        </div>
      </div>
    </div>
  );
}
