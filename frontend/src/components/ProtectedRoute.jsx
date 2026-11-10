// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/authStorage';

export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />;
  }
  return children;
}