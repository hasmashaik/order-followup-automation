export default function FilterBar({ filters, setFilters, employees = [], types = [] }) {
  const update = (k, v) => setFilters({ ...filters, [k]: v });
  return (
    <div className="filter-bar">
      <select value={filters.status || ''} onChange={(e) => update('status', e.target.value)}>
        <option value="">All Statuses</option>
        <option>Open</option>
        <option>In Progress</option>
        <option>Resolved</option>
      </select>
      <select value={filters.priority || ''} onChange={(e) => update('priority', e.target.value)}>
        <option value="">All Priorities</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
      <select value={filters.employee || ''} onChange={(e) => update('employee', e.target.value)}>
        <option value="">All Employees</option>
        {employees.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>
      <select value={filters.exception_type || ''} onChange={(e) => update('exception_type', e.target.value)}>
        <option value="">All Exceptions</option>
        {types.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input type="date" value={filters.from || ''} onChange={(e) => update('from', e.target.value)} title="From Date" />
      <input type="date" value={filters.to || ''} onChange={(e) => update('to', e.target.value)} title="To Date" />
      <button className="secondary" onClick={() => setFilters({})}>Clear</button>
    </div>
  );
}