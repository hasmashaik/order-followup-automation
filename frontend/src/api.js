import axios from 'axios';

// Uses VITE_API_URL in production, falls back to '/api' (proxied) in dev
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

export const uploadFile = (file, uploadedBy = 'manager') => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('uploaded_by', uploadedBy);
  return api.post('/orders/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDashboard = () => api.get('/dashboard');

export const getTasks = (filters = {}) => api.get('/tasks', { params: filters });

export const updateTaskStatus = (id, status, performedBy = 'manager') =>
  api.patch(`/tasks/${id}/status`, { status, performed_by: performedBy });

export const reassignTask = (id, employee, performedBy = 'manager') =>
  api.patch(`/tasks/${id}/reassign`, {
    assigned_employee: employee,
    performed_by: performedBy,
  });

export const downloadDailyReport = async () => {
  const res = await api.get('/reports/daily.csv', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily_exception_report_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const getAudit = (orderId) =>
  api.get('/audit', { params: orderId ? { order_id: orderId } : {} });

export default api;