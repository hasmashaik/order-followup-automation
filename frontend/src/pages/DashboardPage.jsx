import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, AlertCircle, Clock, TrendingUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { getDashboard } from '../api';
import Spinner from '../components/Spinner.jsx';

const REFRESH_MS = 30000;

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      setData(res.data);
      setUpdatedAt(new Date());
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!document.hidden) loadData();
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!data && loading) return <Spinner text="Loading dashboard data..." />;
  if (!data && err) {
    return (
      <div>
        <div className="alert alert-error"><AlertCircle size={20} /> <span className="grow">{err}</span></div>
        <button onClick={loadData}><RefreshCw size={16} /> Try again</button>
      </div>
    );
  }

  const { totals, exceptionsByCategory = [], employeePending = [], highPriorityCases = [] } = data;
  const maxCategory = Math.max(1, ...exceptionsByCategory.map((r) => Number(r.count) || 0));
  const maxPending = Math.max(1, ...employeePending.map((r) => Number(r.pending) || 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Overview Dashboard</h1>
          <p className="subtitle">Real-time snapshot of your order exceptions and team workload.</p>
        </div>
        <div className="header-actions">
          
          <button className="secondary" onClick={loadData} disabled={loading} title="Refresh data">
            <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
          </button>
        </div>
      </div>

      {err && <div className="alert alert-error"><AlertCircle size={20} /> <span className="grow">Couldn't refresh: {err}</span></div>}

      <div className="grid-4">
        <StatCard title="Total Orders" value={totals.totalOrders} hint="All uploaded orders" icon={<ShoppingCart size={18} />} color="#4f46e5" bg="#eef2ff" />
        <StatCard title="Needs Attention" value={totals.ordersRequiringAttention} hint="Orders with open exceptions" icon={<AlertCircle size={18} />} color="#dc2626" bg="#fee2e2" />
        <StatCard title="Open Tasks" value={totals.openTasks} hint="Awaiting resolution" icon={<Clock size={18} />} color="#d97706" bg="#fef3c7" />
        <StatCard title="Overdue Tasks" value={totals.overdueTasks} hint="Past their deadline" icon={<TrendingUp size={18} />} color="#be123c" bg="#ffe4e6" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2><span className="icon-chip" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertCircle size={17} /></span> Exceptions by Category</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Category</th><th className="num">Count</th></tr></thead>
              <tbody>
                {exceptionsByCategory.length === 0 ? (
                  <tr className="empty-row"><td colSpan="2">No open exceptions 🎉</td></tr>
                ) : exceptionsByCategory.map((r) => (
                  <tr key={r.exception_type}>
                    <td>
                      <div className="cell-strong">{r.exception_type}</div>
                      <Bar value={r.count} max={maxCategory} color="#f59e0b" />
                    </td>
                    <td className="num"><span className="badge plain badge-medium">{r.count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2><span className="icon-chip" style={{ background: '#d1fae5', color: '#059669' }}><CheckCircle2 size={17} /></span> Employee Pending Tasks</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th className="num">Pending</th></tr></thead>
              <tbody>
                {employeePending.length === 0 ? (
                  <tr className="empty-row"><td colSpan="2">No pending tasks</td></tr>
                ) : employeePending.map((r) => (
                  <tr key={r.assigned_employee}>
                    <td>
                      <div className="avatar-cell">
                        <span className="avatar">{initials(r.assigned_employee)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cell-strong">{r.assigned_employee}</div>
                          <Bar value={r.pending} max={maxPending} color="#4f46e5" />
                        </div>
                      </div>
                    </td>
                    <td className="num"><span className="badge plain badge-open">{r.pending}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2><span className="icon-chip" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertCircle size={17} /></span> High-Priority Cases</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Exception Type</th><th>Assigned To</th><th>Deadline</th></tr>
            </thead>
            <tbody>
              {highPriorityCases.length === 0 ? (
                <tr className="empty-row"><td colSpan="4">No high-priority cases</td></tr>
              ) : highPriorityCases.map((t) => (
                <tr key={t.id}>
                  <td className="cell-strong mono">{t.order_id}</td>
                  <td>{t.exception_type}</td>
                  <td>{t.assigned_employee}</td>
                  <td style={{ color: '#dc2626', fontWeight: 600 }}>
                    {t.deadline ? new Date(t.deadline).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function initials(name = '') {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?';
}

function Bar({ value, max, color }) {
  const pct = Math.max(4, Math.round(((Number(value) || 0) / max) * 100));
  return (
    <div style={{ height: 5, borderRadius: 9999, background: '#eef1f6', marginTop: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function StatCard({ title, value, hint, icon, color, bg }) {
  return (
    <div className="card stat-card" style={{ '--accent': color }}>
      <div className="stat-top">
        <span className="stat-title">{title}</span>
        <span className="icon-chip" style={{ background: bg, color }}>{icon}</span>
      </div>
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}