import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    axios.get('/api/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        role: user.role
      });
    } else {
      setCurrentUser(null);
      setFormData({ name: '', username: '', password: '', role: 'STAFF' });
    }
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentUser) {
        await axios.put(`/api/users/${currentUser.id}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      setShowModal(false);
      setFormData({ name: '', username: '', password: '', role: 'STAFF' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data pengguna');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (window.confirm(`Ubah status aktif user "${user.name}"?`)) {
      try {
        await axios.patch(`/api/users/${user.id}/toggle-status`);
        fetchUsers();
      } catch (err) {
        alert('Gagal memperbarui status user');
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Yakin ingin menghapus akun pengguna "${user.name}" (${user.username})?`)) {
      try {
        const res = await axios.delete(`/api/users/${user.id}`);
        alert(res.data?.message || 'Pengguna berhasil dihapus');
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus pengguna');
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Manajemen Pengguna (User RBAC)</h2>
          <small className="text-secondary">Kelola data akun, password, dan hak akses Super Admin, Kepala Teknisi, serta Teknisi Lapangan</small>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <i className="bi bi-person-plus me-1"></i> Tambah User Baru
        </button>
      </div>

      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Hak Akses (Role)</th>
                <th className="text-center">Status</th>
                <th className="text-center" style={{ width: '160px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Belum ada pengguna terdaftar.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="text-muted fw-bold">#{u.id}</td>
                    <td className="fw-bold text-dark">{u.name}</td>
                    <td>{u.username}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-subtle text-purple bg-dark' :
                        u.role === 'KEPALA' ? 'bg-primary' : 'bg-secondary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-center">
                      {u.isActive ? (
                        <span className="badge bg-success">AKTIF</span>
                      ) : (
                        <span className="badge bg-danger">NONAKTIF</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Edit Pengguna"
                          onClick={() => handleOpenModal(u)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn ${u.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          title={u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          <i className={`bi ${u.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          title="Hapus Pengguna"
                          onClick={() => handleDeleteUser(u)}
                        >
                          <i className="bi bi-trash"></i>
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

      {/* Modal Form Tambah / Edit Pengguna */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveUser}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    {currentUser ? 'Edit Data Pengguna' : 'Tambah Akun Pengguna'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Nama Lengkap *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Contoh: Ahmad Fauzi"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Username *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Contoh: teknisi"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      {currentUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder={currentUser ? '•••••••• (Biarkan kosong jika tidak ganti)' : 'Minimal 6 karakter'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!currentUser}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Hak Akses (Role) *</label>
                    <select
                      className="form-select form-select-sm"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="STAFF">STAFF (Teknisi Lapangan)</option>
                      <option value="KEPALA">KEPALA (Kepala Teknisi / Approver)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Administrator Penuh)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light border btn-sm" onClick={() => setShowModal(false)} disabled={saving}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Menyimpan...' : currentUser ? 'Simpan Perubahan' : 'Daftarkan Akun'}
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