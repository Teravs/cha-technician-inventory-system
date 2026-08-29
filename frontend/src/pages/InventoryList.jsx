import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function InventoryList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Form State Barang Baru / Edit
  const [formData, setFormData] = useState({
    name: '', brand: '', size: '', stock: 0, minStock: 5, categoryId: '', unitId: ''
  });

  // Form State Adjust Stok
  const [adjustData, setAdjustData] = useState({
    type: 'IN', quantity: 1, reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes, unitRes] = await Promise.all([
        axios.get('/api/items'),
        axios.get('/api/categories'),
        axios.get('/api/units')
      ]);
      setItems(itemsRes.data);
      setCategories(catRes.data);
      setUnits(unitRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenItemModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        name: item.name,
        brand: item.brand,
        size: item.size,
        stock: item.stock,
        minStock: item.minimumStock ?? item.minStock ?? 5,
        categoryId: item.categoryId,
        unitId: item.unitId
      });
    } else {
      setCurrentItem(null);
      setFormData({
        name: '', brand: '', size: '', stock: 0, minStock: 5,
        categoryId: categories[0]?.id || '',
        unitId: units[0]?.id || ''
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (currentItem) {
        await axios.put(`/api/items/${currentItem.id}`, formData);
      } else {
        await axios.post('/api/items', formData);
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data barang');
    }
  };

  const handleOpenAdjustModal = (item) => {
    setCurrentItem(item);
    setAdjustData({ type: 'IN', quantity: 1, reason: '' });
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/items/${currentItem.id}/adjust`, adjustData);
      setShowAdjustModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal melakukan mutasi stok');
    }
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Yakin ingin menghapus barang "${item.name}"?`)) {
      try {
        const res = await axios.delete(`/api/items/${item.id}`);
        alert(res.data?.message || 'Barang berhasil dihapus');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus barang');
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory ? item.categoryId === parseInt(selectedCategory, 10) : true;
    return matchSearch && matchCat;
  });

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'KEPALA';

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Daftar Inventaris Barang</h2>
          <small className="text-secondary">Monitoring stok material dan komponen teknisi CHA</small>
        </div>
        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenItemModal()}>
            <i className="bi bi-plus-lg me-1"></i> Tambah Barang Baru
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card border-slate-200 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-8">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Cari berdasarkan nama barang atau merk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select form-select-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Item */}
      <div className="card border-slate-200 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nama Barang & Spesifikasi</th>
                <th>Kategori</th>
                <th>Satuan</th>
                <th className="text-end">Stok Tersedia</th>
                <th className="text-end">Min. Stok</th>
                <th className="text-center">Status</th>
                {canManage && <th className="text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="text-center py-4 text-muted">Memuat data inventaris...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="text-center py-4 text-muted">Tidak ada data barang yang cocok.</td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const minLimit = item.minimumStock ?? item.minStock ?? 0;
                  const isOut = item.stock <= 0;
                  const isLow = item.stock > 0 && item.stock <= minLimit;

                  return (
                    <tr key={item.id}>
                      <td className="text-muted fw-bold">#{item.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{item.name}</div>
                        <div className="text-muted small">{item.brand} | {item.size}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{item.category?.name}</span></td>
                      <td>{item.unit?.symbol}</td>
                      <td className="text-end fw-bold fs-6">{item.stock}</td>
                      <td className="text-end text-muted">{minLimit}</td>
                      <td className="text-center">
                        {isOut && <span className="badge bg-danger">HABIS</span>}
                        {isLow && <span className="badge bg-warning text-dark">MENIPIS</span>}
                        {!isOut && !isLow && <span className="badge bg-success">AMAN</span>}
                      </td>
                      {canManage && (
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              title="Update Stok (In/Out/Adjust)"
                              onClick={() => handleOpenAdjustModal(item)}
                            >
                              <i className="bi bi-arrow-left-right"></i>
                            </button>
                            <button
                              className="btn btn-outline-primary"
                              title="Edit Detail Barang"
                              onClick={() => handleOpenItemModal(item)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              title="Hapus Barang"
                              onClick={() => handleDeleteItem(item)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Barang */}
      {showItemModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveItem}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">{currentItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowItemModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Nama Barang *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Merk / Brand *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Ukuran / Tipe *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Kategori *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value, 10) })}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Satuan *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.unitId}
                        onChange={(e) => setFormData({ ...formData, unitId: parseInt(e.target.value, 10) })}
                        required
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row g-2">
                    {!currentItem && (
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Stok Awal</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>
                    )}
                    <div className={currentItem ? 'col-12' : 'col-6'}>
                      <label className="form-label small fw-semibold">Batas Minimum Stok *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 1 })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light border btn-sm" onClick={() => setShowItemModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm">Simpan Data</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mutasi / Penyesuaian Stok Langsung */}
      {showAdjustModal && currentItem && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveAdjust}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">Penyesuaian Stok Manual</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="p-2 bg-light rounded mb-3 border">
                    <div className="fw-bold">{currentItem.name}</div>
                    <small className="text-muted">Stok Saat Ini: <strong>{currentItem.stock} {currentItem.unit?.symbol}</strong></small>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Jenis Penyesuaian</label>
                    <select
                      className="form-select form-select-sm"
                      value={adjustData.type}
                      onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                    >
                      <option value="IN">Barang Masuk / Restock (IN)</option>
                      <option value="OUT">Barang Keluar Manual / Rusak (OUT)</option>
                      <option value="ADJUSTMENT">Koreksi Opname Stok (ADJUSTMENT)</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Jumlah (Quantity)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm"
                      value={adjustData.quantity}
                      onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value, 10) || 1 })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Keterangan / Alasan *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Contoh: Pembelian PO-2026/04 atau Penyesuaian hasil stock opname"
                      value={adjustData.reason}
                      onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light border btn-sm" onClick={() => setShowAdjustModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-success btn-sm">Konfirmasi Mutasi</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}