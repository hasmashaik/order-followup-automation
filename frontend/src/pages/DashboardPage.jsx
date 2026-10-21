import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, AlertCircle, Clock, TrendingUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { getDashboard } from '../api';
import Spinner from '../components/Spinner.jsx';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      setData(res.data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount + auto-refresh every 30 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !data) return <Spinner text="Loading dashboard data..." />;
  if (err) return <div className="alert alert-error">{err}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1>Overview Dashboard</h1>
          <p className="subtitle">Real-time snapshot of your order exceptions and team workload.</p>
        </div>
        <button className="secondary" onClick={loadData} disabled={loading} title="Refresh Data">
          <RefreshCw size={18} className={loading ? 'spinner' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div className="grid-4">
        <StatCard title="Total Orders" value={data.totals.totalOrders} icon={<ShoppingCart size={20} />} color="#4f46e5" bg="#e0e7ff" />
        <StatCard title="Needs Attention" value={data.totals.ordersRequiringAttention} icon={<AlertCircle size={20} />} color="#ef4444" bg="#fee2e2" />
        <StatCard title="Open Tasks" value={data.totals.openTasks} icon={<Clock size={20} />} color="#f59e0b" bg="#fef3c7" />
        <StatCard title="Overdue Tasks" value={data.totals.overdueTasks} icon={<TrendingUp size={20} />} color="#be123c" bg="#ffe4e6" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h2><AlertCircle size={20} color="#ef4444" /> Exceptions by Category</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Category</th><th>Count</th></tr></thead>
              <tbody>
                {data.exceptionsByCategory.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: 'center', color: '#64748b' }}>No open exceptions</td></tr>
                ) : data.exceptionsByCategory.map((r) => (
                  <tr key={r.exception_type}>
                    <td style={{ fontWeight: 500 }}>{r.exception_type}</td>
                    <td><span className="badge badge-medium">{r.count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2><CheckCircle2 size={20} color="#10b981" /> Employee Pending Tasks</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th>Pending Tasks</th></tr></thead>
              <tbody>
                {data.employeePending.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: 'center', color: '#64748b' }}>No pending tasks</td></tr>
                ) : data.employeePending.map((r) => (
                  <tr key={r.assigned_employee}>
                    <td style={{ fontWeight: 500 }}>{r.assigned_employee}</td>
                    <td><span className="badge badge-open">{r.pending}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h2><AlertCircle size={20} color="#ef4444" /> High-Priority Cases</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Exception Type</th><th>Assigned To</th><th>Deadline</th></tr>
            </thead>
            <tbody>
              {data.highPriorityCases.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No high-priority cases</td></tr>
              ) : data.highPriorityCases.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.order_id}</td>
                  <td>{t.exception_type}</td>
                  <td>{t.assigned_employee}</td>
                  <td style={{ color: '#ef4444', fontWeight: 500 }}>
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

function StatCard({ title, value, icon, color, bg }) {
  return (
    <div className="card stat-card" style={{ marginBottom: 0 }}>
      <div className="stat-title">
        <div style={{ background: bg, color: color, padding: '10px', borderRadius: '8px', display: 'flex' }}>
          {icon}
        </div>
        {title}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}