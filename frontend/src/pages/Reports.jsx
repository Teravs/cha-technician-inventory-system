import React, { useState } from 'react';
import axios from 'axios';

export default function Reports() {
  const [downloadingWeekly, setDownloadingWeekly] = useState(false);
  const [downloadingMonthly, setDownloadingMonthly] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const handleDownloadWeekly = async () => {
    setDownloadingWeekly(true);
    try {
      const response = await axios.get('/api/reports/weekly/pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CHA_Laporan_Mingguan_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let errMsg = 'Gagal mendownload laporan PDF mingguan.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message) errMsg = parsed.message;
        } catch {
          // ignore
        }
      }
      alert(errMsg);
    } finally {
      setDownloadingWeekly(false);
    }
  };

  const handleDownloadMonthly = async () => {
    setDownloadingMonthly(true);
    try {
      const response = await axios.get(`/api/reports/monthly/pdf?month=${month}&year=${year}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CHA_Laporan_Bulanan_${year}_${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let errMsg = 'Gagal mendownload laporan PDF bulanan.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message) errMsg = parsed.message;
        } catch {
          // ignore
        }
      }
      alert(errMsg);
    } finally {
      setDownloadingMonthly(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-0">Laporan Resmi Inventaris</h2>
        <small className="text-secondary">Cetak dokumen PDF audit mutasi stok PT Chand Hajar Aswad</small>
      </div>

      <div className="row g-4">
        {/* Laporan Mingguan */}
        <div className="col-12 col-md-6">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-calendar-week fs-4 text-primary"></i>
                  <h5 className="fw-bold mb-0 text-dark">Laporan 7 Hari Terakhir</h5>
                </div>
                <p className="text-muted small">
                  Mengunduh rangkuman mutasi barang masuk, barang keluar dari tiket approved teknisi, dan saldo opname 1 minggu terakhir.
                </p>
              </div>
              <button
                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 mt-3"
                onClick={handleDownloadWeekly}
                disabled={downloadingWeekly}
              >
                {downloadingWeekly ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf"></i> Download PDF Mingguan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Laporan Bulanan */}
        <div className="col-12 col-md-6">
          <div className="card border-slate-200 shadow-sm h-100">
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-calendar-month fs-4 text-success"></i>
                  <h5 className="fw-bold mb-0 text-dark">Laporan Bulanan</h5>
                </div>
                <p className="text-muted small mb-3">
                  Pilih periode bulan dan tahun audit inventaris warehouse:
                </p>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <select className="form-select form-select-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <button
                className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleDownloadMonthly}
                disabled={downloadingMonthly}
              >
                {downloadingMonthly ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf"></i> Download PDF Bulanan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}