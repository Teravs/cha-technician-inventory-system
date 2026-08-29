import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/items/${id}`)
      .then((res) => setItem(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-5">Loading ledger history...</div>;
  if (!item) return <div className="alert alert-danger">Item not found</div>;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/inventory" className="btn btn-light border btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Back to Inventory
        </Link>
        <h2 className="h4 fw-bold mb-0">{item.name}</h2>
      </div>

      {/* Item Profile Info */}
      <div className="card border-slate-200 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <span className="text-muted small">Brand & Specification</span>
              <div className="fw-semibold">{item.brand} - {item.size}</div>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted small">Category</span>
              <div className="fw-semibold">{item.category?.name}</div>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted small">Current Stock / Min</span>
              <div className="fw-bold fs-5 text-primary">
                {item.stock} <span className="fs-6 text-muted">{item.unit?.symbol}</span>
                <span className="fs-6 fw-normal text-muted"> / Min: {item.minimumStock}</span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted small">Stock Status</span>
              <div>
                {item.stock === 0 ? (
                  <span className="badge bg-danger">OUT OF STOCK</span>
                ) : item.stock <= item.minimumStock ? (
                  <span className="badge bg-warning">LOW STOCK</span>
                ) : (
                  <span className="badge bg-success">READY</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Ledger History */}
      <div className="card border-slate-200 shadow-sm">
        <div className="card-header bg-white border-bottom py-3">
          <h5 className="card-title fs-6 fw-bold mb-0">Stock Ledger Audit Trail</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="text-center">Type</th>
                <th className="text-end">Stock Before</th>
                <th className="text-end">In</th>
                <th className="text-end">Out</th>
                <th className="text-end">Balance</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {item.stockMovements?.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted">No stock ledger records found.</td></tr>
              ) : (
                item.stockMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.createdAt).toLocaleDateString()} {new Date(movement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{movement.description}</td>
                    <td className="text-center">
                      <span className={`badge ${
                        movement.type === 'IN' ? 'bg-success-subtle text-success' :
                        movement.type === 'OUT' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'
                      }`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="text-end text-muted">{movement.stockBefore}</td>
                    <td className="text-end text-success fw-semibold">
                      {movement.type === 'IN' ? `+${movement.quantity}` : '-'}
                    </td>
                    <td className="text-end text-danger fw-semibold">
                      {movement.type === 'OUT' ? `-${movement.quantity}` : '-'}
                    </td>
                    <td className="text-end fw-bold">{movement.stockAfter}</td>
                    <td>{movement.user?.name}</td>
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