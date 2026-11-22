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

// Tangani token expired / unauthorized / HTML fallback
api.interceptors.response.use(
  (response) => {
    // Jika respon berupa dokumen HTML (misal fallback SPA saat backend offline di Vercel)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!')) {
      const err = new Error('Backend API belum terhubung atau rute tidak ditemukan.');
      err.isHtmlFallback = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
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
