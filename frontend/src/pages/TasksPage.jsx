import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { getTasks, updateTaskStatus, reassignTask } from '../api';
import FilterBar from '../components/FilterBar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [reassignValue, setReassignValue] = useState({});
  const [busyId, setBusyId] = useState(null);

  
  const [knownEmployees, setKnownEmployees] = useState([]);
  const [knownTypes, setKnownTypes] = useState([]);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current; 
    try {
      setLoading(true);
      const res = await getTasks(filters);
      if (id !== reqId.current) return;
      setTasks(res.data);
      setErr('');
    } catch (e) {
      if (id !== reqId.current) return;
      setErr(e?.response?.data?.error || e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setKnownEmployees((prev) => Array.from(new Set([...prev, ...tasks.map((t) => t.assigned_employee).filter(Boolean)])).sort());
    setKnownTypes((prev) => Array.from(new Set([...prev, ...tasks.map((t) => t.exception_type).filter(Boolean)])).sort());
  }, [tasks]);

  const counts = useMemo(() => ({
    open: tasks.filter((t) => t.status === 'Open').length,
    progress: tasks.filter((t) => t.status === 'In Progress').length,
    resolved: tasks.filter((t) => t.status === 'Resolved').length,
  }), [tasks]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    try {
      await updateTaskStatus(id, status);
      toast.success(`Task marked "${status}"`);
      await load();
    } catch (e) {
      toast.error('Could not update status: ' + (e?.response?.data?.error || e.message));
    } finally {
      setBusyId(null);
    }
  };

  const doReassign = async (id) => {
    const emp = (reassignValue[id] || '').trim();
    if (!emp) return;
    setBusyId(id);
    try {
      await reassignTask(id, emp);
      setReassignValue((v) => ({ ...v, [id]: '' }));
      toast.success(`Task reassigned to ${emp}`);
      await load();
    } catch (e) {
      toast.error('Could not reassign: ' + (e?.response?.data?.error || e.message));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Task Management</h1>
          <p className="subtitle">Review, assign, and resolve order exceptions.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
            <Filter size={16} /> Filters
          </div>
          <FilterBar filters={filters} setFilters={setFilters} employees={knownEmployees} types={knownTypes} />
        </div>
      </div>

      {err && <div className="alert alert-error"><AlertCircle size={20} /> <span className="grow">{err}</span></div>}

      {loading && tasks.length === 0 ? (
        <Spinner text="Loading tasks..." />
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</h2>
              <div className="card-sub">{counts.open} open · {counts.progress} in progress · {counts.resolved} resolved</div>
            </div>
          </div>
          <div className="table-wrapper">
            <table style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th>Order &amp; Customer</th>
                  <th>Exception Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr className="empty-row"><td colSpan="6">No tasks match your filters.</td></tr>
                ) : tasks.map((t) => {
                  const rowBusy = busyId === t.id;
                  return (
                    <tr key={t.id} style={{ opacity: rowBusy ? 0.6 : 1 }}>
                      <td>
                        <div className="cell-strong mono">{t.order_id}</div>
                        <div className="cell-muted">{t.customer_name || 'Unknown'}</div>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div className="cell-strong">{t.exception_type}</div>
                        <div className="cell-muted">{t.reason}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${String(t.priority || 'low').toLowerCase()}`}>{t.priority}</span>
                      </td>
                      <td>
                        <select
                          aria-label={`Status for order ${t.order_id}`}
                          value={t.status}
                          onChange={(e) => changeStatus(t.id, e.target.value)}
                          style={{ width: 140, padding: '6px 30px 6px 10px', fontSize: 13 }}
                          disabled={rowBusy}
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                        </select>
                      </td>
                      <td>
                        <div className="cell-strong">{t.assigned_employee || 'Unassigned'}</div>
                        <div className="cell-muted">Due: {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</div>
                        <form
                          className="assign-row"
                          onSubmit={(e) => { e.preventDefault(); doReassign(t.id); }}
                        >
                          <input
                            aria-label={`New assignee for order ${t.order_id}`}
                            placeholder="New assignee"
                            value={reassignValue[t.id] || ''}
                            onChange={(e) => setReassignValue((v) => ({ ...v, [t.id]: e.target.value }))}
                            disabled={rowBusy}
                          />
                          <button type="submit" className="secondary sm" disabled={rowBusy || !(reassignValue[t.id] || '').trim()}>Set</button>
                        </form>
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}