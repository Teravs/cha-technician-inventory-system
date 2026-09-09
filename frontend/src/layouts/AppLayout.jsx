import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none transition-all ${
      isActive
        ? 'text-white fw-bold shadow-sm'
        : 'text-light-slate hover-nav-dark'
    }`;

  const navItemStyle = ({ isActive }) => ({
    backgroundColor: isActive ? '#1d68e1' : 'transparent',
    color: isActive ? '#ffffff' : '#cbd5e1',
    fontWeight: isActive ? 600 : 500,
    fontSize: '13.5px',
    transition: 'all 0.15s ease',
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isKepala = user?.role === 'KEPALA';

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: '#0b1320', color: '#f8fafc' }}>
      {/* Sidebar Desktop */}
      <aside
        className="d-none d-lg-flex flex-column flex-shrink-0 p-3"
        style={{
          width: '260px',
          backgroundColor: '#121c2d',
          borderRight: '1px solid #1e2c42',
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <img
            src="/engineer.jpeg"
            alt="Chan Engineer Logo"
            style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: '7px' }}
          />
          <div>
            <h6 className="fw-bold mb-0 text-white" style={{ fontSize: '14px' }}>Chan Engineer</h6>
            <small style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 500 }}>PT Chand Hajar Aswad</small>
          </div>
        </div>

        <ul className="nav nav-pills flex-column gap-1 mb-auto">
          <li className="nav-item">
            <NavLink to="/dashboard" className={navItemClass} style={navItemStyle}>
              <i className="bi bi-grid-1x2-fill me-1"></i> Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/inventory" className={navItemClass} style={navItemStyle}>
              <i className="bi bi-box-seam-fill me-1"></i> Data Barang / Stok
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/requests" className={navItemClass} style={navItemStyle}>
              <i className="bi bi-card-checklist me-1"></i> Permintaan Barang
            </NavLink>
          </li>

          {(isSuperAdmin || isKepala) && (
            <>
              <li
                className="nav-header text-uppercase px-3 mt-3 mb-1"
                style={{ fontSize: '10.5px', letterSpacing: '0.8px', color: '#64748b', fontWeight: 700 }}
              >
                Audit & Laporan
              </li>
              <li className="nav-item">
                <NavLink to="/stock-history" className={navItemClass} style={navItemStyle}>
                  <i className="bi bi-clock-history me-1"></i> Riwayat Mutasi
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/reports" className={navItemClass} style={navItemStyle}>
                  <i className="bi bi-file-earmark-pdf-fill me-1"></i> Laporan PDF
                </NavLink>
              </li>
            </>
          )}

          {isSuperAdmin && (
            <>
              <li
                className="nav-header text-uppercase px-3 mt-3 mb-1"
                style={{ fontSize: '10.5px', letterSpacing: '0.8px', color: '#64748b', fontWeight: 700 }}
              >
                Master Data
              </li>
              <li className="nav-item">
                <NavLink to="/users" className={navItemClass} style={navItemStyle}>
                  <i className="bi bi-people-fill me-1"></i> Kelola User
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/categories" className={navItemClass} style={navItemStyle}>
                  <i className="bi bi-tags-fill me-1"></i> Kategori
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/units" className={navItemClass} style={navItemStyle}>
                  <i className="bi bi-rulers me-1"></i> Satuan / Unit
                </NavLink>
              </li>
            </>
          )}
        </ul>

        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '1rem 0' }} />

        <div className="dropdown">
          <div
            className="d-flex align-items-center justify-content-between p-2 rounded-3"
            style={{ backgroundColor: '#182335', border: '1px solid #223249' }}
          >
            <div>
              <div className="fw-semibold text-white small">{user?.name}</div>
              <span
                className="badge mt-1"
                style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '10px' }}
              >
                {user?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-sm border-0 p-1" style={{ color: '#f87171' }} title="Logout">
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        {/* Mobile Header Bar */}
        <header
          className="d-lg-none d-flex align-items-center justify-content-between p-3"
          style={{ backgroundColor: '#121c2d', borderBottom: '1px solid #1e2c42' }}
        >
          <div className="d-flex align-items-center gap-2">
            <img
              src="/engineer.jpeg"
              alt="Logo"
              style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: '5px' }}
            />
            <span className="fw-bold text-white small">Chan Engineer</span>
          </div>
          <button
            className="btn btn-sm text-white border-0"
            style={{ backgroundColor: '#1e293b' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <i className="bi bi-list fs-5"></i>
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div
            className="d-lg-none p-3 shadow-lg"
            style={{ backgroundColor: '#121c2d', borderBottom: '1px solid #1e2c42' }}
          >
            <ul className="nav nav-pills flex-column gap-1">
              <li><NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Dashboard</NavLink></li>
              <li><NavLink to="/inventory" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Data Barang</NavLink></li>
              <li><NavLink to="/requests" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Permintaan</NavLink></li>
              {(isSuperAdmin || isKepala) && (
                <>
                  <li><NavLink to="/stock-history" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Riwayat Mutasi</NavLink></li>
                  <li><NavLink to="/reports" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Laporan PDF</NavLink></li>
                </>
              )}
              {isSuperAdmin && (
                <>
                  <li><NavLink to="/users" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Kelola User</NavLink></li>
                  <li><NavLink to="/categories" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Kategori</NavLink></li>
                  <li><NavLink to="/units" onClick={() => setMobileOpen(false)} className={navItemClass} style={navItemStyle}>Satuan</NavLink></li>
                </>
              )}
              <li className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button onClick={handleLogout} className="btn btn-danger btn-sm w-100">Logout</button>
              </li>
            </ul>
          </div>
        )}

        <main className="p-3 p-md-4 flex-grow-1 overflow-auto" style={{ backgroundColor: '#0b1320' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}