import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1'
});

// Otomatis sisipkan Bearer token jika ada di localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gymnasyum_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tangani token expired / unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Jika bukan request login, bersihkan token expired
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('gymnasyum_token');
        localStorage.removeItem('gymnasyum_user');
        window.dispatchEvent(new Event('gymnasyum:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
