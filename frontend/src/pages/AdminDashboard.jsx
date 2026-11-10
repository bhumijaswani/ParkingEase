// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { clearAuth, getAdmin } from '../utils/authStorage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    setError('');
    try {
      const res = await axiosClient.get('/slots/summary');
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data.');
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Logged in as {admin?.name || 'Admin'}</p>

      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {summary && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            flex: 1, textAlign: 'center', padding: '16px',
            background: 'var(--color-primary-light)', borderRadius: 'var(--radius)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {summary.total}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Slots</div>
          </div>

          <div style={{
            flex: 1, textAlign: 'center', padding: '16px',
            background: '#fef2f2', borderRadius: 'var(--radius)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>
              {summary.occupied}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Occupied</div>
          </div>

          <div style={{
            flex: 1, textAlign: 'center', padding: '16px',
            background: '#ecfdf5', borderRadius: 'var(--radius)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>
              {summary.free}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Free</div>
          </div>
        </div>
      )}

      <button className="btn-primary" onClick={fetchSummary} style={{ marginBottom: '16px' }}>
        Refresh
      </button>

      <div className="link-row">
        <a onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</a>
      </div>
    </div>
  );
}