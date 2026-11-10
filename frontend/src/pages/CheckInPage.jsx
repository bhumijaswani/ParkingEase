// src/pages/CheckInPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckInForm from '../components/CheckInForm';
import CheckOutForm from '../components/CheckOutForm';
import { clearAuth, getAdmin } from '../utils/authStorage';

export default function CheckInPage() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const [mode, setMode] = useState('checkin'); // 'checkin' ya 'checkout'

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <div className="page-container">
      <h1 className="page-title">ParkingEase</h1>
      <p className="page-subtitle">
        Logged in as {admin?.name || 'Staff'}
      </p>

      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className="btn-primary"
          style={{ opacity: mode === 'checkin' ? 1 : 0.5 }}
          onClick={() => setMode('checkin')}
        >
          Check In
        </button>
        <button
          className="btn-primary"
          style={{ opacity: mode === 'checkout' ? 1 : 0.5 }}
          onClick={() => setMode('checkout')}
        >
          Check Out
        </button>
      </div>

      {mode === 'checkin' ? <CheckInForm /> : <CheckOutForm />}

      <div className="link-row">
        <a onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</a>
      </div>
    </div>
  );
}