import ReminderTable from '../components/ReminderTable';
import {
  Users,
  Calendar,
  Bell,
  AlertCircle,
  PlusCircle,
  CalendarPlus,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function OverviewPage({
  members = [],
  schedules = [],
  reminders = [],
  whatsapp,
  update,
  onNavigate
}) {
  const pendingCount = reminders.filter(
    (r) => r.status === 'scheduled' || r.status === 'no_response'
  ).length;

  const highPriorityCount = reminders.filter((r) => r.priority === 'high').length;
  const activeMembersCount = members.filter((m) => m.membership_status === 'active').length;

  const statsCards = [
    {
      title: 'Total Member',
      value: members.length,
      subtext: `${activeMembersCount} aktif berlangganan`,
      icon: Users,
      colorClass: 'stat-card-purple',
      navTarget: 'Members'
    },
    {
      title: 'Jadwal Kelas',
      value: schedules.length,
      subtext: 'Total sesi terjadwal',
      icon: Calendar,
      colorClass: 'stat-card-blue',
      navTarget: 'Schedules'
    },
    {
      title: 'Pengingat Hari Ini',
      value: reminders.length,
      subtext: 'Jadwal kelas hari ini',
      icon: Bell,
      colorClass: 'stat-card-amber',
      navTarget: 'Reminders'
    },
    {
      title: 'Perlu Follow-up',
      value: pendingCount,
      subtext: highPriorityCount > 0 ? `${highPriorityCount} prioritas tinggi` : 'Siap dikonfirmasi',
      icon: AlertCircle,
      colorClass: 'stat-card-rose',
      navTarget: 'Reminders'
    }
  ];

  return (
    <div className="overview-container">
      {/* Welcome Banner */}
      <div className="welcome-banner-card">
        <div className="welcome-text-content">
          <div className="welcome-badge">
            <Sparkles size={14} />
            <span>Smart CRM Gymnasyum</span>
          </div>
          <h3>Pantau Aktivitas Gym & Pengingat Kehadiran</h3>
          <p>
            Kelola data member, jadwalkan kelas gym, dan kirimkan pengingat WhatsApp otomatis untuk
            meningkatkan tingkat kehadiran kelas member Anda.
          </p>
        </div>

        {onNavigate && (
          <div className="welcome-quick-actions">
            <button
              className="btn-quick-action primary-quick"
              onClick={() => onNavigate('Members')}
            >
              <PlusCircle size={16} />
              <span>Tambah Member</span>
            </button>
            <button
              className="btn-quick-action secondary-quick"
              onClick={() => onNavigate('Schedules')}
            >
              <CalendarPlus size={16} />
              <span>Buat Jadwal Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Stats Cards */}
      <div className="stats-cards-grid">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`modern-stat-card ${card.colorClass}`}
              onClick={() => onNavigate && card.navTarget && onNavigate(card.navTarget)}
              role="button"
              tabIndex={0}
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <Icon size={22} />
                </div>
                {onNavigate && <ArrowRight size={16} className="stat-arrow-hint" />}
              </div>
              <div className="stat-card-bottom">
                <strong className="stat-value">{card.value}</strong>
                <span className="stat-title">{card.title}</span>
                <small className="stat-subtext">{card.subtext}</small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Follow-ups Section */}
      <div className="dashboard-section-card">
        <div className="section-header-bar">
          <div>
            <h3>Tindak Lanjut & Pengingat Hari Ini</h3>
            <p>Daftar member dengan kelas hari ini yang membutuhkan pesan pengingat WhatsApp.</p>
          </div>
          {onNavigate && (
            <button
              className="btn-link-action"
              onClick={() => onNavigate('Reminders')}
            >
              Lihat Semua Antrean ({reminders.length}) &rarr;
            </button>
          )}
        </div>

        <ReminderTable rows={reminders} whatsapp={whatsapp} update={update} />
      </div>
    </div>
  );
}
