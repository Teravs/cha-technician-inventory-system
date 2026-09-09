import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background: 'linear-gradient(135deg, #09347a 0%, #0e48a5 50%, #082d6b 100%)',
      }}
    >
      <div
        className="card border-0"
        style={{
          width: '100%',
          maxWidth: '410px',
          backgroundColor: '#162234',
          borderRadius: '18px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div className="card-body p-4 p-sm-4">
          {/* Header & Logo */}
          <div className="text-center mb-4">
            <div className="d-inline-block p-1 rounded-3 mb-2" style={{ backgroundColor: '#0f172a' }}>
              <img
                src="/engineer.jpeg"
                alt="Chan Engineer"
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
            <h1 className="h5 fw-bold text-white mb-1">Chan Engineer</h1>
            <p className="small mb-0" style={{ color: '#38bdf8', fontWeight: 500 }}>
              PT Chand Hajar Aswad
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="alert py-2 px-3 small d-flex align-items-center mb-3 border-0"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
            >
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold" style={{ color: '#38bdf8' }}>
                Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Teravs"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  backgroundColor: '#0e1626',
                  border: '1.5px solid #1d4ed8',
                  color: '#ffffff',
                  borderRadius: '9px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '13.5px',
                }}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold" style={{ color: '#38bdf8' }}>
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    backgroundColor: '#0e1626',
                    border: '1.5px solid #1d4ed8',
                    borderRight: 'none',
                    color: '#ffffff',
                    borderTopLeftRadius: '9px',
                    borderBottomLeftRadius: '9px',
                    padding: '0.6rem 0.85rem',
                    fontSize: '13.5px',
                  }}
                  required
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    backgroundColor: '#0e1626',
                    border: '1.5px solid #1d4ed8',
                    borderLeft: 'none',
                    color: '#94a3b8',
                    borderTopRightRadius: '9px',
                    borderBottomRightRadius: '9px',
                  }}
                  tabIndex="-1"
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-100 py-2 fw-semibold text-white shadow-sm"
              style={{
                backgroundColor: '#1d68e1',
                borderRadius: '9px',
                fontSize: '14px',
                border: 'none',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-4 pt-3 text-center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <small style={{ color: '#94a3b8', fontSize: '11px' }}>
              Restricted enterprise system. Authorized access only.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}