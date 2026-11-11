import { useState, useEffect } from 'react';
import api from '../api/api';
import { User, Lock, Eye, EyeOff, ArrowRight, Dumbbell, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Muat username tersimpan jika ada
  useEffect(() => {
    const savedUsername = localStorage.getItem('gymnasyum_saved_username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Mohon lengkapi username dan kata sandi.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        username: username.trim(),
        password
      });

      if (rememberMe) {
        localStorage.setItem('gymnasyum_saved_username', username.trim());
      } else {
        localStorage.removeItem('gymnasyum_saved_username');
      }

      localStorage.setItem('gymnasyum_token', data.token);
      localStorage.setItem('gymnasyum_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Username atau kata sandi tidak cocok. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-backdrop-glow"></div>

      <div className="login-card-container">
        {/* Brand & Greeting Header */}
        <div className="login-card-header">
          <div className="brand-badge">
            <Dumbbell className="brand-icon" size={26} />
          </div>
          <h2>Gymnasyum</h2>
          <span className="brand-tagline">CRM ADMIN SYSTEM</span>
          <p className="login-subtitle">
            Selamat datang! Silakan masuk untuk mengelola data member, jadwal kelas, dan reminder WhatsApp.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="login-alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form-modern" noValidate>
          <div className="input-field-group">
            <label htmlFor="login-username">Username atau Email</label>
            <div className="input-with-icon">
              <User className="field-icon" size={18} />
              <input
                id="login-username"
                type="text"
                placeholder="Contoh: admin atau nama@email.com"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label htmlFor="login-password">Kata Sandi</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi Anda..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              Ingat username saya
            </label>
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-state">
                <span className="spinner"></span> Memverifikasi...
              </span>
            ) : (
              <span className="button-content">
                Masuk ke Dashboard <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        {/* Helpful Default Account Helper */}
        <div className="quick-access-panel">
          <div className="quick-access-header">
            <ShieldCheck size={16} className="quick-access-icon" />
            <span>Akun Admin Bawaan</span>
          </div>
          <div className="quick-access-content">
            <div className="quick-credentials">
              <span>User: <strong>admin</strong></span>
              <span className="bullet">&bull;</span>
              <span>Pass: <strong>admin123</strong></span>
            </div>
            <button
              type="button"
              className="quick-fill-chip"
              onClick={handleQuickFill}
            >
              Isi Otomatis
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="login-card-footer">
          <small>&copy; {new Date().getFullYear()} Gymnasyum. Sistem Manajemen Gym & CRM.</small>
        </div>
      </div>
    </div>
  );
}
