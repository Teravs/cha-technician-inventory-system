import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'warning',
    icon: 'bi-question-circle',
    loading: false,
    action: null,
  });

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

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
        showToast('Kategori berhasil diperbarui.', 'success');
      } else {
        await axios.post('/api/categories', formData);
        showToast('Kategori baru berhasil ditambahkan.', 'success');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan kategori.', 'danger');
    }
  };

  const handleOpenToggleStatusModal = (cat) => {
    const isDeactivating = cat.isActive !== false;
    setConfirmState({
      show: true,
      title: isDeactivating ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori',
      message: isDeactivating
        ? `Kategori "${cat.name}" akan dinonaktifkan.`
        : `Kategori "${cat.name}" akan diaktifkan kembali.`,
      confirmText: isDeactivating ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      confirmVariant: isDeactivating ? 'warning' : 'success',
      icon: isDeactivating ? 'bi-toggle-off' : 'bi-toggle-on',
      loading: false,
      action: async () => {
        try {
          await axios.patch(`/api/categories/${cat.id}/toggle-status`);
          showToast(`Status kategori "${cat.name}" berhasil diubah.`, 'success');
          setConfirmState((prev) => ({ ...prev, show: false }));
          fetchCategories();
        } catch {
          showToast('Gagal memperbarui status kategori.', 'danger');
          setConfirmState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleConfirmAction = async () => {
    if (confirmState.action) {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      await confirmState.action();
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
                        <span className="badge bg-success-subtle text-success border border-success-subtle">AKTIF</span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">NONAKTIF</span>
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
                          className={`btn ${cat.isActive !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          title="Ubah Status"
                          onClick={() => handleOpenToggleStatusModal(cat)}
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

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        icon={confirmState.icon}
        loading={confirmState.loading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState((prev) => ({ ...prev, show: false }))}
      />

      {/* Floating Modern Toast Alert */}
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

