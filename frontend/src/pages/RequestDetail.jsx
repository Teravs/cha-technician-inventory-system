import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequestDetails = () => {
    setLoading(true);
    axios.get(`/api/requests/${id}`)
      .then((res) => setRequest(res.data))
      .catch((err) => setActionError(err.response?.data?.message || 'Failed to fetch request detail.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleApprove = async () => {
    setProcessing(true);
    setActionError('');
    try {
      await axios.patch(`/api/requests/${id}/approve`);
      setShowApproveModal(false);
      fetchRequestDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Approval failed. Please review stock balances.');
      setShowApproveModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    setProcessing(true);
    setActionError('');
    try {
      await axios.patch(`/api/requests/${id}/reject`, {
        reason: rejectionReason.trim()
      });
      setShowRejectModal(false);
      fetchRequestDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Rejection failed.');
      setShowRejectModal(false);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5 text-secondary">Loading request details...</div>;
  }

  if (!request) {
    return <div className="alert alert-danger">Request record not found.</div>;
  }

  const isPending = request.status === 'PENDING';
  const isKepala = user?.role === 'KEPALA';
  const hasInsufficientStock = request.items?.some((i) => i.quantity > i.item.stock);

  return (
    <div className="container-fluid p-0">
      {/* Header Context */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/requests" className="btn btn-light border btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back
          </Link>
          <div>
            <h2 className="h4 fw-bold text-dark mb-0">Request #{request.requestCode}</h2>
            <small className="text-secondary">Submitted on {new Date(request.createdAt).toLocaleString()}</small>
          </div>
        </div>

        {/* Kepala Action Buttons */}
        {isKepala && isPending && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-danger btn-sm px-3"
              onClick={() => {
                setRejectionReason('');
                setShowRejectModal(true);
              }}
            >
              <i className="bi bi-x-circle me-1"></i> Reject Request
            </button>
            <button
              className="btn btn-success btn-sm px-3"
              disabled={hasInsufficientStock}
              onClick={() => setShowApproveModal(true)}
            >
              <i className="bi bi-check-circle me-1"></i> Approve Request
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="alert alert-danger d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          <div>{actionError}</div>
        </div>
      )}

      {/* Meta Information Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-body">
              <span className="text-muted small fw-semibold">REQUEST STATUS</span>
              <div className="mt-2">
                {request.status === 'PENDING' && <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">PENDING</span>}
                {request.status === 'APPROVED' && <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">APPROVED</span>}
                {request.status === 'REJECTED' && <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">REJECTED</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-body">
              <span className="text-muted small fw-semibold">REQUESTER</span>
              <div className="fw-bold text-dark mt-2">{request.requester?.name}</div>
              <small className="text-muted">{request.requester?.username}</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-body">
              <span className="text-muted small fw-semibold">DECISION LOG</span>
              {request.status === 'PENDING' ? (
                <div className="text-muted mt-2 small">Awaiting review from operational head</div>
              ) : (
                <div className="mt-2">
                  <div className="fw-semibold text-dark small">By: {request.approver?.name || 'System'}</div>
                  <small className="text-muted">{new Date(request.approvedAt).toLocaleString()}</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Purpose */}
      <div className="card border-slate-200 shadow-sm mb-4">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="card-title fs-6 fw-bold mb-0 text-dark">Purpose of Request</h5>
        </div>
        <div className="card-body">
          <p className="mb-0 text-dark" style={{ fontSize: '14px', whiteSpace: 'pre-line' }}>
            {request.purpose}
          </p>
          {request.status === 'REJECTED' && request.rejectionReason && (
            <div className="alert alert-danger-subtle border border-danger-subtle mt-3 mb-0">
              <strong>Rejection Reason:</strong> {request.rejectionReason}
            </div>
          )}
        </div>
      </div>

      {/* Items Requested Table */}
      <div className="card border-slate-200 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="card-title fs-6 fw-bold mb-0 text-dark">Material Checklist</h5>
          {isPending && hasInsufficientStock && (
            <span className="text-danger small fw-semibold">
              <i className="bi bi-exclamation-circle me-1"></i> Stock shortage detected
            </span>
          )}
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Item Specification</th>
                <th className="text-end">Requested Quantity</th>
                <th className="text-end">Current Stock</th>
                <th className="text-center">Availability Status</th>
              </tr>
            </thead>
            <tbody>
              {request.items?.map((line) => {
                const isShort = isPending && line.quantity > line.item.stock;
                return (
                  <tr key={line.id} className={isShort ? 'table-danger' : ''}>
                    <td>{line.item.id}</td>
                    <td>
                      <strong>{line.item.name}</strong>
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        {line.item.brand} | {line.item.size}
                      </div>
                    </td>
                    <td className="text-end fw-bold">
                      {line.quantity}
                    </td>
                    <td className="text-end">
                      {line.item.stock}
                    </td>
                    <td className="text-center">
                      {isPending ? (
                        isShort ? (
                          <span className="badge bg-danger">INSUFFICIENT</span>
                        ) : (
                          <span className="badge bg-success">AVAILABLE</span>
                        )
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Approve Request</h5>
                <button type="button" className="btn-close" onClick={() => setShowApproveModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="text-secondary mb-2" style={{ fontSize: '14px' }}>
                  Are you sure you want to approve request <strong>#{request.requestCode}</strong>?
                </p>
                <div className="alert alert-warning small mb-0">
                  <i className="bi bi-info-circle me-1"></i> This action will atomically decrement warehouse stock and generate OUT stock movements in the audit ledger.
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-light border" onClick={() => setShowApproveModal(false)} disabled={processing}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleApprove} disabled={processing}>
                  {processing ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleReject}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-danger">Reject Request</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-secondary mb-3" style={{ fontSize: '14px' }}>
                    Rejecting request <strong>#{request.requestCode}</strong> will not alter warehouse inventory.
                  </p>
                  <div className="mb-2">
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: '13px' }}>
                      Reason for Rejection <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g., Insufficient overall stock, incorrect unit requested, or task delayed."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light border" onClick={() => setShowRejectModal(false)} disabled={processing}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={processing || !rejectionReason.trim()}>
                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
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