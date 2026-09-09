import React, { useEffect } from 'react';

export default function ToastNotification({
  show,
  message,
  type = 'success', // 'success' | 'danger' | 'warning' | 'info'
  onClose,
  duration = 3500,
}) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show || !message) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-danger text-white',
          icon: 'bi-x-circle-fill',
          title: 'Terjadi Kesalahan',
        };
      case 'warning':
        return {
          bg: 'bg-warning text-dark',
          icon: 'bi-exclamation-triangle-fill',
          title: 'Peringatan',
        };
      case 'info':
        return {
          bg: 'bg-primary text-white',
          icon: 'bi-info-circle-fill',
          title: 'Informasi',
        };
      default:
        return {
          bg: 'bg-success text-white',
          icon: 'bi-check-circle-fill',
          title: 'Berhasil',
        };
    }
  };

  const { bg, icon, title } = getTypeStyles();

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1090, maxWidth: '380px' }}
    >
      <div
        className={`toast show border-0 shadow-lg rounded-3 overflow-hidden ${bg}`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex align-items-center p-3">
          <i className={`bi ${icon} fs-4 me-3`}></i>
          <div className="flex-grow-1">
            <div className="fw-bold small mb-0">{title}</div>
            <div className="small opacity-90">{message}</div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white ms-2"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>
      </div>
    </div>
  );
}

