// src/utils/authStorage.js
const TOKEN_KEY = 'smartparking_admin_token';
const ADMIN_KEY = 'smartparking_admin_info';

export function saveAuth(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdmin() {
  const data = localStorage.getItem(ADMIN_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}