import { Loader2 } from 'lucide-react';

export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="state-center" role="status" aria-live="polite">
      <Loader2 size={38} className="spinner" />
      <p>{text}</p>
    </div>
  );
}