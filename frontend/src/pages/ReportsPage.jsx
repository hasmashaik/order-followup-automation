import { useEffect, useState, useCallback } from 'react';
import { Download, History, RefreshCw } from 'lucide-react';
import { downloadDailyReport, getAudit } from '../api';
import Spinner from '../components/Spinner.jsx';

export default function ReportsPage() {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1>Reports & Audit Trail</h1>
          <p className="subtitle">Download operational data and review system history.</p>
        </div>
        <button className="secondary" onClick={loadAudit} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinner' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>Daily Exception Report</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Contains new exceptions, unresolved tasks, overdue tasks, and employee workload.</p>
        </div>
        <button onClick={downloadDailyReport} style={{ background: '#10b981' }}>
          <Download size={18} /> Download CSV
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 16px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0' }}>
          <History size={20} /> <h2 style={{ margin: 0 }}>Audit Trail</h2>
        </div>
        
        {err && <div className="alert alert-error" style={{ margin: '24px 24px 0 24px' }}>{err}</div>}
        
        {loading && audit.length === 0 ? (
          <Spinner text="Loading audit history..." />
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
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
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No audit records yet.</td></tr>
                ) : audit.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(a.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{a.order_id}</td>
                    <td><span className="badge badge-open">{a.action}</span></td>
                    <td style={{ color: '#64748b' }}>{a.from_value || '—'}</td>
                    <td style={{ color: '#64748b' }}>{a.to_value || '—'}</td>
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