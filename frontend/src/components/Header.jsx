import { RefreshCw, LogOut, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

const PAGE_META = {
  Overview: {
    title: 'Dashboard Overview',
    desc: 'Ringkasan statistik member, jadwal kelas, dan pengingat aktif hari ini.'
  },
  Members: {
    title: 'Manajemen Member',
    desc: 'Kelola data pelanggan gym, informasi kontak, dan status keanggotaan aktif.'
  },
  Schedules: {
    title: 'Jadwal Kelas Gym',
    desc: 'Atur sesi latihan, jadwal instruktur, dan catat presensi kehadiran member.'
  },
  Reminders: {
    title: 'Antrean Pengingat (Reminders)',
    desc: 'Kirim notifikasi draf WhatsApp dan tindak lanjuti konfirmasi kehadiran.'
  },
  History: {
    title: 'Riwayat Log Komunikasi',
    desc: 'Catatan seluruh riwayat perubahan status follow-up dan respon member.'
  }
};

export default function Header({ page, user, onLogout, onRefresh, loading = false }) {
  const meta = PAGE_META[page] || {
    title: page,
    desc: 'Kelola operasional gym dan CRM dalam satu dashboard.'
  };

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <header className="app-top-header">
      <div className="header-titles">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-root">GYMNASYUM</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{page.toUpperCase()}</span>
        </div>
        <h2>{meta.title}</h2>
        <p>{meta.desc}</p>
      </div>

      <div className="header-actions-panel">
        {/* Date chip */}
        <div className="header-chip date-chip">
          <CalendarIcon size={14} />
          <span>{currentDate}</span>
        </div>

        {/* Server status chip */}
        <div className="header-chip status-chip">
          <CheckCircle2 size={14} className="status-indicator-icon" />
          <span>Server Terhubung</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            className={`header-icon-btn refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={onRefresh}
            title="Segarkan Data"
          >
            <RefreshCw size={16} />
          </button>
        )}

        {/* User profile dropdown / avatar */}
        <div className="header-user-badge">
          <span className="user-initials-badge">{initials}</span>
          <div className="user-name-box">
            <strong>{user?.name || 'Administrator'}</strong>
            <small>@{user?.username || 'admin'}</small>
          </div>
          {onLogout && (
            <button className="header-quick-logout" onClick={onLogout} title="Keluar">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
