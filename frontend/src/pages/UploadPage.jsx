import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { uploadFile } from '../api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await uploadFile(file);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1>Upload Orders</h1>
      <p className="subtitle">Upload your CSV or Excel file. The system will automatically validate data and generate exception tasks.</p>

      {error && <div className="alert alert-error"><AlertTriangle size={20}/> {error}</div>}

      <div className="card">
        <form onSubmit={onSubmit}>
          <div 
            className="upload-zone" 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadCloud size={56} className="upload-icon" />
            <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Click to upload or drag and drop</h2>
            <p className="subtitle" style={{ marginBottom: '24px' }}>CSV, XLSX, or XLS (max 10MB)</p>
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <FileSpreadsheet size={24} color="#4f46e5" />
                <span style={{ fontWeight: 600 }}>{file.name}</span>
                <span style={{ color: '#64748b', fontSize: '14px' }}>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!file || busy} style={{ minWidth: '150px' }}>
              {busy ? 'Processing...' : 'Process File'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="alert alert-success" style={{ display: 'block', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '18px', fontWeight: '600' }}>
            <CheckCircle size={24} /> Upload Successful
          </div>
          <div className="grid-4" style={{ margin: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Rows Inserted</div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '4px' }}>{result.results.inserted}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Validation Errors</div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '4px', color: result.results.invalid > 0 ? '#b91c1c' : 'inherit' }}>{result.results.invalid}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Duplicates</div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '4px' }}>{result.results.duplicates}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>Tasks Created</div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '4px', color: '#4f46e5' }}>{result.ruleSummary.created}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2><AlertTriangle size={20} color="#f59e0b" /> Expected CSV Columns</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
          {['Order ID', 'Order Date', 'Customer Name', 'Phone Number', 'Order Value', 'Payment Type', 'Order Status', 'Dispatch Date', 'Expected Delivery Date', 'Assigned Employee'].map(col => (
            <span key={col} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>{col}</span>
          ))}
        </div>
      </div>
    </div>
  );
}