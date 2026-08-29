import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UnitManagement() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [formData, setFormData] = useState({ name: '', symbol: '' });

  const fetchUnits = () => {
    setLoading(true);
    axios.get('/api/units')
      .then((res) => setUnits(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleOpenModal = (unit = null) => {
    if (unit) {
      setCurrentUnit(unit);
      setFormData({ name: unit.name, symbol: unit.symbol });
    } else {
      setCurrentUnit(null);
      setFormData({ name: '', symbol: '' });
    }
    setShowModal(true);
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    try {
      if (currentUnit) {
        await axios.put(`/api/units/${currentUnit.id}`, formData);
      } else {
        await axios.post('/api/units', formData);
      }
      setShowModal(false);
      fetchUnits();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data satuan');
    }
  };

  const handleToggleStatus = async (unit) => {
    if (window.confirm(`Ubah status aktif satuan "${unit.name}"?`)) {
      try {
        await axios.patch(`/api/units/${unit.id}/toggle-status`);
        fetchUnits();
      } catch (err) {
        alert('Gagal memperbarui status satuan');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Master Data Satuan (Unit)</h2>
          <small className="text-secondary">Kelola satuan ukur material (PCS, BOX, MTR, ROL, SET, dsb.)</small>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg me-1"></i> Tambah Satuan Baru
        </button>
      </div>

      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nama Satuan</th>
                <th>Simbol / Kode</th>
                <th className="text-center" style={{ width: '120px' }}>Status</th>
                <th className="text-center" style={{ width: '160px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Memuat data satuan...</td></tr>
              ) : units.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Belum ada satuan terdaftar.</td></tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id}>
                    <td className="text-muted fw-bold">#{unit.id}</td>
                    <td className="fw-bold text-dark">{unit.name}</td>
                    <td>
                      <span className="badge bg-light text-primary border px-2 py-1 fs-6">
                        {unit.symbol}
                      </span>
                    </td>
                    <td className="text-center">
                      {unit.isActive !== false ? (
                        <span className="badge bg-success">AKTIF</span>
                      ) : (
                        <span className="badge bg-danger">NONAKTIF</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Edit Satuan"
                          onClick={() => handleOpenModal(unit)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn ${unit.isActive !== false ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          title="Ubah Status"
                          onClick={() => handleToggleStatus(unit)}
                        >
                          <i className={`bi ${unit.isActive !== false ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveUnit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    {currentUnit ? 'Edit Satuan' : 'Tambah Satuan Baru'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Nama Satuan *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Contoh: Pieces, Box, Meter"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Simbol / Kode Singkat *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Contoh: PCS, BOX, MTR, ROL"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light border btn-sm" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

