import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, X, ListChecks } from 'lucide-react';
import { uploadFile } from '../api';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['.csv', '.xlsx', '.xls'];
const COLUMNS = ['Order ID', 'Order Date', 'Customer Name', 'Phone Number', 'Order Value', 'Payment Type', 'Order Status', 'Dispatch Date', 'Expected Delivery Date', 'Assigned Employee'];

function validate(f) {
  const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED.includes(ext)) return 'Unsupported file type. Please upload a CSV, XLSX or XLS file.';
  if (f.size > MAX_BYTES) return 'File is too large. The maximum size is 10 MB.';
  return '';
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    const problem = validate(f);
    setResult(null);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setError('');
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await uploadFile(file);
      setResult(res.data);
      clearFile();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Upload Orders</h1>
          <p className="subtitle">Upload your CSV or Excel file. The system will automatically validate data and generate exception tasks.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertTriangle size={20} /> <span className="grow">{error}</span>
        </div>
      )}

      <div className="card">
        <form onSubmit={onSubmit} className="card-body">
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Choose a file to upload"
            onClick={openPicker}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-icon-wrap"><UploadCloud size={34} /></div>
            <h2 style={{ fontSize: 19 }}>Click to upload or drag and drop</h2>
            <p className="subtitle" style={{ margin: 0 }}>CSV, XLSX, or XLS (max 10MB)</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => pick(e.target.files?.[0])}
            />
            {file && (
              <div className="file-pill" onClick={(e) => e.stopPropagation()}>
                <FileSpreadsheet size={22} color="#4f46e5" />
                <span className="name">{file.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" className="ghost sm" onClick={clearFile} aria-label="Remove file" disabled={busy}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!file || busy} style={{ minWidth: 160 }}>
              <UploadCloud size={16} /> {busy ? 'Processing...' : 'Process File'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card" role="status">
          <div className="card-header">
            <h2 style={{ color: 'var(--success)' }}><CheckCircle size={22} /> Upload Successful</h2>
          </div>
          <div className="card-body">
            <div className="result-grid">
              <ResultTile label="Rows Inserted" value={result.results?.inserted} />
              <ResultTile label="Validation Errors" value={result.results?.invalid} color={result.results?.invalid > 0 ? '#dc2626' : undefined} />
              <ResultTile label="Duplicates" value={result.results?.duplicates} color={result.results?.duplicates > 0 ? '#d97706' : undefined} />
              <ResultTile label="Tasks Created" value={result.ruleSummary?.created} color="#4f46e5" />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2><span className="icon-chip" style={{ background: '#eef2ff', color: '#4f46e5' }}><ListChecks size={17} /></span> Expected CSV Columns</h2>
        </div>
        <div className="card-body">
          <div className="chip-list">
            {COLUMNS.map((col) => <span key={col} className="chip">{col}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultTile({ label, value, color }) {
  return (
    <div className="result-tile">
      <div className="label">{label}</div>
      <div className="value" style={color ? { color } : undefined}>{value ?? 0}</div>
    </div>
  );
}