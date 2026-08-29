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
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-slate-50 px-3">
      <div className="card border-slate-200 shadow-sm" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="bg-primary text-white fw-bold d-inline-flex align-items-center justify-content-center rounded-3 mb-2" style={{ width: 48, height: 48, fontSize: '20px' }}>
              CHA
            </div>
            <h1 className="h5 fw-bold text-dark mb-1">CHA Technician Inventory System</h1>
            <p className="text-secondary small mb-0">PT Chand Hajar Aswad</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="admin / kepala / teknisi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-secondary small fw-semibold">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
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

          <div className="mt-4 pt-3 border-top text-center">
            <small className="text-muted" style={{ fontSize: '11px' }}>
              Restricted enterprise system. Authorized access only.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}