import React from 'react';

export default function ConfirmModal({
  show,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmVariant = 'primary', // 'primary' | 'success' | 'warning' | 'danger'
  icon = 'bi-question-circle',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          iconBg: 'bg-danger-subtle text-danger',
          btnClass: 'btn-danger',
        };
      case 'warning':
        return {
          iconBg: 'bg-warning-subtle text-warning',
          btnClass: 'btn-warning text-dark',
        };
      case 'success':
        return {
          iconBg: 'bg-success-subtle text-success',
          btnClass: 'btn-success',
        };
      default:
        return {
          iconBg: 'bg-primary-subtle text-primary',
          btnClass: 'btn-primary',
        };
    }
  };

  const { iconBg, btnClass } = getVariantStyles();

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(11, 19, 32, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div
          className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
          style={{ backgroundColor: '#162234', border: '1px solid #2a3d5b' }}
        >
          <div className="modal-body p-4 text-center">
            <div
              className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${iconBg}`}
              style={{ width: '56px', height: '56px', fontSize: '26px' }}
            >
              <i className={`bi ${icon}`}></i>
            </div>
            <h5 className="fw-bold text-white mb-2">{title}</h5>
            <p className="small mb-0 px-2" style={{ color: '#cbd5e1' }}>{message}</p>
          </div>
          <div
            className="modal-footer border-top-0 d-flex justify-content-center gap-2 p-3"
            style={{ backgroundColor: '#121c2d', borderTop: '1px solid #223249' }}
          >
            <button
              type="button"
              className="btn px-4 btn-sm fw-semibold"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${btnClass} px-4 btn-sm fw-semibold d-flex align-items-center gap-2`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm"></span>}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

