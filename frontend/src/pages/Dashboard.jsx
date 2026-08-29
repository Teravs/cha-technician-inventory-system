import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-5 text-secondary">Loading dashboard...</div>;
  }

  const renderBadge = (status) => {
    switch (status) {
      case 'READY': return <span className="badge bg-success-subtle text-success border border-success-subtle">READY</span>;
      case 'LOW_STOCK': return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">LOW STOCK</span>;
      case 'OUT_OF_STOCK': return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">OUT OF STOCK</span>;
      default: return null;
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold text-slate-900 mb-1">Inventory Dashboard</h2>
          <p className="text-muted small mb-0">Operational summary and automated stock monitoring</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-slate-200 shadow-sm">
            <div className="card-body">
              <span className="text-muted small fw-semibold text-uppercase">Total Items</span>
              <h3 className="fw-bold mt-2 mb-0 text-slate-900">{data?.metrics.totalItems || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-slate-200 shadow-sm">
            <div className="card-body">
              <span className="text-success small fw-semibold text-uppercase">Ready Stock</span>
              <h3 className="fw-bold mt-2 mb-0 text-success">{data?.metrics.ready || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-slate-200 shadow-sm">
            <div className="card-body">
              <span className="text-warning small fw-semibold text-uppercase">Low Stock</span>
              <h3 className="fw-bold mt-2 mb-0 text-warning">{data?.metrics.lowStock || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-slate-200 shadow-sm">
            <div className="card-body">
              <span className="text-danger small fw-semibold text-uppercase">Out of Stock</span>
              <h3 className="fw-bold mt-2 mb-0 text-danger">{data?.metrics.outOfStock || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Monitoring Lists */}
      <div className="row g-4">
        {/* Low Stock Table */}
        <div className="col-12 col-lg-6">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title fs-6 fw-bold mb-0 text-warning">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>Low Stock Items
              </h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Item</th>
                    <th>Stock</th>
                    <th>Min</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.lowStockItems?.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-3 text-muted">All inventory levels are healthy.</td></tr>
                  ) : (
                    data?.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          <strong>{item.name}</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{item.brand}</div>
                        </td>
                        <td><strong>{item.stock}</strong></td>
                        <td>{item.minimumStock}</td>
                        <td>{renderBadge(item.calculatedStatus)}</td>
                        <td className="text-end">
                          <Link to={`/inventory/${item.id}`} className="btn btn-sm btn-outline-primary" title="View Detail">
                            <i className="bi bi-eye"></i>
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

        {/* Out of Stock Table */}
        <div className="col-12 col-lg-6">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title fs-6 fw-bold mb-0 text-danger">
                <i className="bi bi-x-octagon-fill me-2"></i>Out of Stock Items
              </h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Item</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.outOfStockItems?.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-3 text-muted">No out-of-stock items detected.</td></tr>
                  ) : (
                    data?.outOfStockItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          <strong>{item.name}</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{item.brand}</div>
                        </td>
                        <td><span className="text-danger fw-bold">0</span></td>
                        <td>{renderBadge(item.calculatedStatus)}</td>
                        <td className="text-end">
                          <Link to={`/inventory/${item.id}`} className="btn btn-sm btn-outline-primary" title="View Detail">
                            <i className="bi bi-eye"></i>
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
      </div>
    </div>
  );
}