import { Loader2 } from 'lucide-react';

export default function Spinner({ text = 'Loading...' }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px',
      width: '100%',
      color: 'var(--primary)'
    }}>
      <Loader2 size={40} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>{text}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}