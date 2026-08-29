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
    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${
      isActive ? 'bg-primary text-white fw-semibold' : 'text-secondary hover-bg-light'
    }`;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isKepala = user?.role === 'KEPALA';

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar Desktop */}
      <aside className="d-none d-lg-flex flex-column flex-shrink-0 p-3 bg-white border-end" style={{ width: '260px' }}>
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <div className="bg-primary text-white fw-bold rounded-2 px-2 py-1 fs-5">CHA</div>
          <div>
            <h6 className="fw-bold mb-0 text-dark">PT Chand Hajar Aswad</h6>
            <small className="text-muted" style={{ fontSize: '11px' }}>Technician Inventory</small>
          </div>
        </div>

        <ul className="nav nav-pills flex-column gap-1 mb-auto">
          <li className="nav-item">
            <NavLink to="/dashboard" className={navItemClass}>
              <i className="bi bi-grid-1x2-fill"></i> Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/inventory" className={navItemClass}>
              <i className="bi bi-box-seam-fill"></i> Data Barang / Stok
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/requests" className={navItemClass}>
              <i className="bi bi-card-checklist"></i> Permintaan Barang
            </NavLink>
          </li>

          {(isSuperAdmin || isKepala) && (
            <>
              <li className="nav-header text-uppercase text-muted px-3 mt-3 mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                Audit & Laporan
              </li>
              <li className="nav-item">
                <NavLink to="/stock-history" className={navItemClass}>
                  <i className="bi bi-clock-history"></i> Riwayat Mutasi
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/reports" className={navItemClass}>
                  <i className="bi bi-file-earmark-pdf-fill"></i> Laporan PDF
                </NavLink>
              </li>
            </>
          )}

          {isSuperAdmin && (
            <>
              <li className="nav-header text-uppercase text-muted px-3 mt-3 mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                Master Data
              </li>
              <li className="nav-item">
                <NavLink to="/users" className={navItemClass}>
                  <i className="bi bi-people-fill"></i> Kelola User
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/categories" className={navItemClass}>
                  <i className="bi bi-tags-fill"></i> Kategori
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/units" className={navItemClass}>
                  <i className="bi bi-rulers"></i> Satuan / Unit
                </NavLink>
              </li>
            </>
          )}
        </ul>

        <hr className="text-secondary opacity-25" />

        <div className="dropdown">
          <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
            <div>
              <div className="fw-semibold text-dark small">{user?.name}</div>
              <span className="badge bg-dark-subtle text-dark border" style={{ fontSize: '10px' }}>{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm border-0" title="Logout">
              <i className="bi bi-box-arrow-right fs-6"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Mobile Header Bar */}
        <header className="d-lg-none d-flex align-items-center justify-content-between bg-white border-bottom p-3">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white fw-bold rounded px-2 py-1 fs-6">CHA</div>
            <span className="fw-bold text-dark">Inventory</span>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setMobileOpen(!mobileOpen)}>
            <i className="bi bi-list fs-5"></i>
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="d-lg-none bg-white border-bottom p-3 shadow-sm">
            <ul className="nav nav-pills flex-column gap-1">
              <li><NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navItemClass}>Dashboard</NavLink></li>
              <li><NavLink to="/inventory" onClick={() => setMobileOpen(false)} className={navItemClass}>Data Barang</NavLink></li>
              <li><NavLink to="/requests" onClick={() => setMobileOpen(false)} className={navItemClass}>Permintaan</NavLink></li>
              {(isSuperAdmin || isKepala) && (
                <>
                  <li><NavLink to="/stock-history" onClick={() => setMobileOpen(false)} className={navItemClass}>Riwayat Mutasi</NavLink></li>
                  <li><NavLink to="/reports" onClick={() => setMobileOpen(false)} className={navItemClass}>Laporan PDF</NavLink></li>
                </>
              )}
              {isSuperAdmin && (
                <>
                  <li><NavLink to="/users" onClick={() => setMobileOpen(false)} className={navItemClass}>Kelola User</NavLink></li>
                  <li><NavLink to="/categories" onClick={() => setMobileOpen(false)} className={navItemClass}>Kategori</NavLink></li>
                  <li><NavLink to="/units" onClick={() => setMobileOpen(false)} className={navItemClass}>Satuan</NavLink></li>
                </>
              )}
              <li className="mt-2 pt-2 border-top">
                <button onClick={handleLogout} className="btn btn-danger btn-sm w-100">Logout</button>
              </li>
            </ul>
          </div>
        )}

        <main className="p-3 p-md-4 flex-grow-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}