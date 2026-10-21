const CLASS_MAP = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Resolved: 'badge-resolved',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${CLASS_MAP[status] || 'badge-open'}`}>{status}</span>;
}