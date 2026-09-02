import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    axios.get('/api/stock-movements')
      .then((res) => setMovements(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movements.filter((m) => {
    const d = new Date(m.createdAt);
    const matchType = filterType ? m.type === filterType : true;
    const matchMonth = filterMonth !== '' ? d.getMonth() + 1 === parseInt(filterMonth, 10) : true;
    const matchYear = filterYear ? d.getFullYear() === parseInt(filterYear, 10) : true;
    return matchType && matchMonth && matchYear;
  });

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Riwayat Mutasi & Audit Stok</h2>
          <small className="text-secondary">Log audit histori barang masuk, barang keluar dari tiket teknisi, dan penyesuaian opname</small>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {/* Filter Bulan */}
          <select
            className="form-select form-select-sm"
            style={{ width: '140px' }}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>

          {/* Filter Tahun */}
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: '90px' }}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            placeholder="Tahun"
          />

          {/* Filter Tipe */}
          <select
            className="form-select form-select-sm"
            style={{ width: '160px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Semua Jenis Mutasi</option>
            <option value="IN">Barang Masuk (IN)</option>
            <option value="OUT">Barang Keluar (OUT)</option>
            <option value="ADJUSTMENT">Penyesuaian (ADJUST)</option>
          </select>
        </div>
      </div>

      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '130px' }}>Waktu & Tanggal</th>
                <th className="text-center" style={{ width: '100px' }}>Tipe</th>
                <th>Nama Barang & Spesifikasi</th>
                <th className="text-end" style={{ width: '110px' }}>Jumlah</th>
                <th>Teknisi Pemohon / PIC</th>
                <th>Keterangan / Referensi</th>
                <th>Approver / Eksekutor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">Memuat data mutasi...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">Tidak ada riwayat mutasi stok untuk filter ini.</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td className="text-muted small">
                      {new Date(m.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="text-center">
                      {m.type === 'IN' && <span className="badge bg-success">MASUK</span>}
                      {m.type === 'OUT' && <span className="badge bg-danger">KELUAR</span>}
                      {m.type === 'ADJUSTMENT' && <span className="badge bg-secondary">ADJUST</span>}
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{m.item?.name}</div>
                      <small className="text-muted">{m.item?.brand} - {m.item?.size}</small>
                    </td>
                    <td className="text-end fw-bold">
                      <span className={m.type === 'IN' ? 'text-success' : m.type === 'OUT' ? 'text-danger' : 'text-dark'}>
                        {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : `${m.quantity}`} {m.item?.unit?.symbol}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark small">{m.technicianName || m.user?.name || '-'}</div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        {m.referenceType === 'REQUEST_FULFILLMENT' ? 'Teknisi Pemohon' : m.user?.role || '-'}
                      </small>
                    </td>
                    <td>
                      {m.requestCode && (
                        <div>
                          <span className="badge bg-light text-primary border me-1">#{m.requestCode}</span>
                        </div>
                      )}
                      <div className="small text-muted">{m.requestPurpose || m.description || '-'}</div>
                    </td>
                    <td>
                      <div className="fw-semibold small">{m.user?.name || 'Sistem'}</div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>{m.user?.role}</small>
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