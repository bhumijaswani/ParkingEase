import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SlotGrid from '../components/SlotGrid';
import useLiveSlots from '../hooks/useLiveSlots';
import { clearAuth, getAdmin } from '../utils/authStorage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const { slots, connected, loading, error } = useLiveSlots();

  const counts = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.occupancy === 'OCCUPIED').length;
    return { total, occupied, free: total - occupied };
  }, [slots]);

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  const cards = [
    { label: 'Total Slots', value: counts.total, bg: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' },
    { label: 'Occupied', value: counts.occupied, bg: '#fef2f2', color: '#dc2626' },
    { label: 'Free', value: counts.free, bg: '#ecfdf5', color: '#059669' },
  ];

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">
        Logged in as {admin?.name || 'Admin'} ·{' '}
        <span style={{ color: connected ? '#059669' : '#9ca3af', fontWeight: 600 }}>
          ● {connected ? 'Live' : 'Reconnecting…'}
        </span>
      </p>

      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
      {loading && <p>Loading slots…</p>}

      {!loading && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {cards.map((c) => (
              <div key={c.label} style={{
                flex: 1, textAlign: 'center', padding: 16,
                background: c.bg, borderRadius: 'var(--radius)',
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{c.label}</div>
              </div>
            ))}
          </div>

          <SlotGrid slots={slots} />
        </>
      )}

      <div className="link-row">
        <a onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</a>
      </div>
    </div>
  );
}