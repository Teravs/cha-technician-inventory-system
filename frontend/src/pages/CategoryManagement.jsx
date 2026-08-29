import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = () => {
    setLoading(true);
    axios.get('/api/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setCurrentCategory(cat);
      setFormData({ name: cat.name, description: cat.description || '' });
    } else {
      setCurrentCategory(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (currentCategory) {
        await axios.put(`/api/categories/${currentCategory.id}`, formData);
      } else {
        await axios.post('/api/categories', formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan kategori');
    }
  };

  const handleToggleStatus = async (cat) => {
    if (window.confirm(`Ubah status aktif kategori "${cat.name}"?`)) {
      try {
        await axios.patch(`/api/categories/${cat.id}/toggle-status`);
        fetchCategories();
      } catch (err) {
        alert('Gagal memperbarui status kategori');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Master Data Kategori</h2>
          <small className="text-secondary">Kelola pengelompokan jenis barang & material inventaris</small>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg me-1"></i> Tambah Kategori
        </button>
      </div>

      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nama Kategori</th>
                <th>Deskripsi</th>
                <th className="text-center" style={{ width: '120px' }}>Status</th>
                <th className="text-center" style={{ width: '160px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Memuat data kategori...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Belum ada kategori terdaftar.</td></tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="text-muted fw-bold">#{cat.id}</td>
                    <td className="fw-bold text-dark">{cat.name}</td>
                    <td className="text-muted">{cat.description || '-'}</td>
                    <td className="text-center">
                      {cat.isActive !== false ? (
                        <span className="badge bg-success">AKTIF</span>
                      ) : (
                        <span className="badge bg-danger">NONAKTIF</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Edit Kategori"
                          onClick={() => handleOpenModal(cat)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn ${cat.isActive !== false ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          title="Ubah Status"
                          onClick={() => handleToggleStatus(cat)}
                        >
                          <i className={`bi ${cat.isActive !== false ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
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
              <form onSubmit={handleSaveCategory}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    {currentCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Nama Kategori *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Contoh: Electrical Components"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Deskripsi</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Keterangan singkat kategori..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

