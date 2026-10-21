import { X } from 'lucide-react';

export default function FilterBar({ filters, setFilters, employees = [], types = [] }) {
  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    if (!value) delete next[key]; 
    setFilters(next);
  };
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="filter-bar">
      <div className="field">
        <label htmlFor="f-status">Status</label>
        <select id="f-status" value={filters.status || ''} onChange={(e) => update('status', e.target.value)}>
          <option value="">All statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-priority">Priority</label>
        <select id="f-priority" value={filters.priority || ''} onChange={(e) => update('priority', e.target.value)}>
          <option value="">All priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-employee">Employee</label>
        <select id="f-employee" value={filters.employee || ''} onChange={(e) => update('employee', e.target.value)}>
          <option value="">All employees</option>
          {employees.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-type">Exception</label>
        <select id="f-type" value={filters.exception_type || ''} onChange={(e) => update('exception_type', e.target.value)}>
          <option value="">All exceptions</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-from">From</label>
        <input id="f-from" type="date" value={filters.from || ''} max={filters.to || undefined} onChange={(e) => update('from', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="f-to">To</label>
        <input id="f-to" type="date" value={filters.to || ''} min={filters.from || undefined} onChange={(e) => update('to', e.target.value)} />
      </div>
      <button type="button" className="secondary" onClick={() => setFilters({})} disabled={!hasFilters}>
        <X size={16} /> Clear
      </button>
    </div>
  );
}