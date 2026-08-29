import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function RequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    const params = filterStatus ? { status: filterStatus } : {};
    axios.get('/api/requests', { params })
      .then((res) => setRequests(res.data))
      .catch((err) => console.error('Failed to fetch requests:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const isStaff = user?.role === 'STAFF';

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">PENDING</span>;
      case 'APPROVED':
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">APPROVED</span>;
      case 'REJECTED':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">REJECTED</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Permintaan Barang (Work Order)</h2>
          <small className="text-secondary">Daftar pengajuan material & suku cadang teknisi lapangan</small>
        </div>
        {isStaff && (
          <Link to="/requests/create" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> Buat Permintaan Baru
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card border-slate-200 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-6 col-md-4">
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status Pengajuan</option>
                <option value="PENDING">PENDING (Menunggu Persetujuan)</option>
                <option value="APPROVED">APPROVED (Disetujui)</option>
                <option value="REJECTED">REJECTED (Ditolak)</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-8 text-sm-end text-muted small">
              Total Pengajuan: <strong>{requests.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>No. Tiket</th>
                <th>Pemohon (Teknisi)</th>
                <th>Tujuan / Deskripsi Pekerjaan</th>
                <th className="text-center">Jml Item</th>
                <th>Tanggal Pengajuan</th>
                <th className="text-center">Status</th>
                <th className="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">Memuat data permintaan...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Tidak ada data permintaan barang.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span className="fw-bold text-primary">#{req.requestCode}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{req.requester?.name}</div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>{req.requester?.username}</small>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '280px' }} title={req.purpose}>
                        {req.purpose}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">
                        {req.items?.length || 0} Jenis
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(req.createdAt).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="text-center">
                      {renderStatusBadge(req.status)}
                    </td>
                    <td className="text-end">
                      <Link to={`/requests/${req.id}`} className="btn btn-outline-primary btn-sm py-1 px-2" title="Lihat Detail">
                        <i className="bi bi-eye me-1"></i> Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

