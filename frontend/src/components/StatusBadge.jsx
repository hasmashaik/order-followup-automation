export default function StatusBadge({ status }) {
  const cls =
    status === 'Open'
      ? 'badge-open'
      : status === 'In Progress'
      ? 'badge-progress'
      : 'badge-resolved';
  return <span className={`badge ${cls}`}>{status}</span>;
}