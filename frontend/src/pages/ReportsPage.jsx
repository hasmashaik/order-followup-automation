import { useEffect, useState, useCallback } from 'react';
import { Download, History, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { downloadDailyReport, getAudit } from '../api';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';

export default function ReportsPage() {
  const toast = useToast();
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState('');

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAudit();
      setAudit(res.data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadDailyReport();
      toast.success('Daily report download started');
    } catch (e) {
      toast.error('Download failed: ' + (e?.response?.data?.error || e.message));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports &amp; Audit Trail</h1>
          <p className="subtitle">Download operational data and review system history.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={loadAudit} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span className="icon-chip" style={{ background: '#d1fae5', color: '#059669', width: 42, height: 42, borderRadius: 12 }}>
              <FileText size={20} />
            </span>
            <div>
              <h2>Daily Exception Report</h2>
              <p className="card-sub" style={{ maxWidth: 520 }}>
                Contains new exceptions, unresolved tasks, overdue tasks, and employee workload.
              </p>
            </div>
          </div>
          <button className="success" onClick={handleDownload} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Preparing...' : 'Download CSV'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2><span className="icon-chip" style={{ background: '#eef2ff', color: '#4f46e5' }}><History size={17} /></span> Audit Trail</h2>
            {audit.length > 0 && <div className="card-sub" style={{ marginLeft: 42 }}>{audit.length} recorded {audit.length === 1 ? 'action' : 'actions'}</div>}
          </div>
        </div>

        {err && (
          <div className="alert alert-error" style={{ margin: '20px 22px 0' }}>
            <AlertCircle size={20} /> <span className="grow">{err}</span>
          </div>
        )}

        {loading && audit.length === 0 ? (
          <Spinner text="Loading audit history..." />
        ) : (
          <div className="table-wrapper">
            <table style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Order ID</th>
                  <th>Action</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {audit.length === 0 ? (
                  <tr className="empty-row"><td colSpan="6">No audit records yet.</td></tr>
                ) : audit.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</td>
                    <td className="cell-strong mono">{a.order_id}</td>
                    <td><span className="badge plain badge-open">{a.action}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.from_value || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.to_value || '—'}</td>
                    <td>{a.performed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}