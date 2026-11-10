// src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { saveAuth } from '../utils/authStorage';

export default function Home() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/admin/login', {
        email: form.email.trim(),
        password: form.password,
      });
      saveAuth(res.data.token, res.data.admin);
      navigate('/checkin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">ParkingEase</h1>
      <p className="page-subtitle">Staff Login</p>

      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-input"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="link-row">
        <a onClick={() => navigate('/admin/login')} style={{ cursor: 'pointer' }}>
          Login as Admin
        </a>
      </div>
    </div>
  );
}