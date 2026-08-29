import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    axios.get('/api/stock-movements')
      .then((res) => setMovements(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movements.filter((m) => (filterType ? m.type === filterType : true));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Riwayat Mutasi & Audit Stok</h2>
          <small className="text-secondary">Log pencatatan histori barang masuk, keluar, dan penyesuaian</small>
        </div>
        <div>
          <select
            className="form-select form-select-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Semua Jenis Mutasi</option>
            <option value="IN">Barang Masuk (IN)</option>
            <option value="OUT">Barang Keluar (OUT)</option>
            <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
          </select>
        </div>
      </div>

      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>Waktu Transaksi</th>
                <th>Tipe</th>
                <th>Nama Barang</th>
                <th className="text-end">Jumlah</th>
                <th>Keterangan / Referensi</th>
                <th>Eksekutor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Memuat data mutasi...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Belum ada riwayat mutasi stok.</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td className="text-muted">{new Date(m.createdAt).toLocaleString('id-ID')}</td>
                    <td>
                      {m.type === 'IN' && <span className="badge bg-success">IN (Masuk)</span>}
                      {m.type === 'OUT' && <span className="badge bg-danger">OUT (Keluar)</span>}
                      {m.type === 'ADJUSTMENT' && <span className="badge bg-secondary">ADJUST</span>}
                    </td>
                    <td>
                      <div className="fw-bold">{m.item?.name}</div>
                      <small className="text-muted">{m.item?.brand} - {m.item?.size}</small>
                    </td>
                    <td className="text-end fw-bold">
                      {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`} {m.item?.unit?.symbol}
                    </td>
                    <td>{m.reason || '-'}</td>
                    <td>
                      <div className="fw-semibold small">{m.user?.name || 'System'}</div>
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