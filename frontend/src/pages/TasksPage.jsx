import { useEffect, useMemo, useState, useCallback } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { getTasks, updateTaskStatus, reassignTask } from '../api';
import FilterBar from '../components/FilterBar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [reassignValue, setReassignValue] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTasks(filters);
      setTasks(res.data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const employees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assigned_employee))).filter(Boolean),
    [tasks]
  );
  const types = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.exception_type))),
    [tasks]
  );

  const changeStatus = async (id, status) => {
    try {
      await updateTaskStatus(id, status);
      load(); // Re-fetch to update UI instantly
    } catch (e) {
      alert('Error updating status: ' + e.message);
    }
  };

  const doReassign = async (id) => {
    const emp = reassignValue[id];
    if (!emp) return;
    try {
      await reassignTask(id, emp);
      setReassignValue({ ...reassignValue, [id]: '' });
      load(); // Re-fetch to update UI instantly
    } catch (e) {
      alert('Error reassigning: ' + e.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1>Task Management</h1>
          <p className="subtitle">Review, assign, and resolve order exceptions.</p>
        </div>
        <button className="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinner' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
          <Filter size={18} /> Filters
        </div>
        <FilterBar filters={filters} setFilters={setFilters} employees={employees} types={types} />
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      {loading && tasks.length === 0 ? (
        <Spinner text="Loading tasks..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Order & Customer</th>
                  <th>Exception Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No tasks match your filters.</td></tr>
                ) : tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.order_id}</div>
                      <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{t.customer_name || 'Unknown'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{t.exception_type}</div>
                      <div style={{ color: '#64748b', fontSize: '13px', maxWidth: '250px', marginTop: '2px' }}>{t.reason}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </td>
                    <td>
                      <select 
                        value={t.status} 
                        onChange={(e) => changeStatus(t.id, e.target.value)}
                        style={{ width: '130px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1' }}
                        disabled={loading}
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>{t.assigned_employee}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Due: {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          placeholder="New assignee"
                          value={reassignValue[t.id] || ''}
                          onChange={(e) => setReassignValue({ ...reassignValue, [t.id]: e.target.value })}
                          style={{ width: '110px', padding: '6px 8px', fontSize: '12px' }}
                          disabled={loading}
                        />
                        <button className="secondary" onClick={() => doReassign(t.id)} style={{ padding: '6px 12px', fontSize: '12px' }} disabled={loading}>Set</button>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}