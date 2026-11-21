import ReminderTable from '../components/ReminderTable';
import {
  Users,
  Calendar,
  Bell,
  AlertCircle,
  PlusCircle,
  CalendarPlus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  History,
  CheckCircle2
} from 'lucide-react';

export default function OverviewPage({
  members = [],
  schedules = [],
  reminders = [],
  whatsapp,
  update,
  onNavigate,
  onOpenMessageDrafter,
  onOpenTimeline
}) {
  const pendingCount = reminders.filter(
    (r) => r.status === 'scheduled' || r.status === 'no_response'
  ).length;

  const highPriorityCount = reminders.filter((r) => r.priority === 'high').length;
  const activeMembersCount = members.filter((m) => m.membership_status === 'active').length;

  const statsCards = [
    {
      title: 'Total Pelanggan Member',
      value: members.length,
      subtext: `${activeMembersCount} aktif berlangganan`,
      icon: Users,
      colorClass: 'stat-card-purple',
      navTarget: 'Members',
      actionHint: 'Buka Menu Data Member'
    },
    {
      title: 'Jadwal Sesi Latihan',
      value: schedules.length,
      subtext: 'Total jadwal kelas aktif',
      icon: Calendar,
      colorClass: 'stat-card-blue',
      navTarget: 'Schedules',
      actionHint: 'Buka Menu Jadwal'
    },
    {
      title: 'Pengingat Hari Ini',
      value: reminders.length,
      subtext: 'Sesi latihan terjadwal hari ini',
      icon: Bell,
      colorClass: 'stat-card-amber',
      navTarget: 'Reminders',
      actionHint: 'Buka Menu Pengingat'
    },
    {
      title: 'Perlu Follow-up WA',
      value: pendingCount,
      subtext:
        highPriorityCount > 0
          ? `${highPriorityCount} prioritas tinggi butuh atensi`
          : 'Semua draf siap dikirim',
      icon: AlertCircle,
      colorClass: 'stat-card-rose',
      navTarget: 'Reminders',
      actionHint: 'Tindak Lanjuti Sekarang'
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
          <h3>Pantau Aktivitas Gym & Pengingat Kehadiran Pelanggan</h3>
          <p>
            Kelola data member dan jadwal kelas latihan secara lengkap (CRUD), pantau pengingat WhatsApp harian,
            lacak alur konfirmasi kehadiran secara end-to-end, dan catat riwayat komunikasi untuk meningkatkan retensi member.
          </p>
        </div>

        {onNavigate && (
          <div className="welcome-quick-actions">
            <button
              type="button"
              className="btn-quick-action primary-quick"
              onClick={() => onNavigate('Members')}
              title="Daftarkan pelanggan baru"
            >
              <PlusCircle size={16} />
              <span>+ Tambah Pelanggan</span>
            </button>
            <button
              type="button"
              className="btn-quick-action secondary-quick"
              onClick={() => onNavigate('Schedules')}
              title="Jadwalkan sesi kelas baru"
            >
              <CalendarPlus size={16} />
              <span>+ Buat Jadwal Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* 4-Step Interactive Workflow Pipeline Guidance */}
      <div className="system-workflow-guidance-card">
        <div className="guidance-card-header">
          <div className="guidance-title-box">
            <Sparkles size={16} className="text-primary" />
            <strong>Alur Kerja Operasional Gymnasyum (4 Langkah Terstruktur):</strong>
          </div>
          <span className="guidance-subtitle">Alur otomatis dari pendaftaran, jadwal, pengingat WA, hingga evaluasi kehadiran</span>
        </div>
        <div className="workflow-steps-horizontal-track">
          <div className="workflow-step-box" onClick={() => onNavigate && onNavigate('Members')} title="Buka Manajemen Member">
            <div className="step-number-circle">1</div>
            <div className="step-text-wrap">
              <strong>1. Daftarkan Pelanggan</strong>
              <small>Data profil & kontak WhatsApp aktif</small>
            </div>
          </div>

          <ArrowRight size={16} className="workflow-track-arrow" />

          <div className="workflow-step-box" onClick={() => onNavigate && onNavigate('Schedules')} title="Buka Jadwal Kelas">
            <div className="step-number-circle">2</div>
            <div className="step-text-wrap">
              <strong>2. Jadwalkan Latihan</strong>
              <small>Status awal otomatis "Menunggu" (Pending)</small>
            </div>
          </div>

          <ArrowRight size={16} className="workflow-track-arrow" />

          <div className="workflow-step-box" onClick={() => onNavigate && onNavigate('Reminders')} title="Buka Pengingat Harian">
            <div className="step-number-circle">3</div>
            <div className="step-text-wrap">
              <strong>3. Kirim Pengingat WA</strong>
              <small>Scheduled &rarr; Sent &rarr; Responded</small>
            </div>
          </div>

          <ArrowRight size={16} className="workflow-track-arrow" />

          <div className="workflow-step-box" onClick={() => onNavigate && onNavigate('Schedules')} title="Buka Presensi Hari-H">
            <div className="step-number-circle">4</div>
            <div className="step-text-wrap">
              <strong>4. Isi Presensi di Gym</strong>
              <small>Tandai Hadir / Tidak Hadir saat sesi selesai</small>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Navigation Stat Cards */}
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
              title={`${card.actionHint} (${card.value})`}
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <Icon size={22} />
                </div>
                {onNavigate && (
                  <div className="stat-nav-hint-box">
                    <span className="stat-nav-text">Buka</span>
                    <ArrowRight size={14} className="stat-arrow-hint" />
                  </div>
                )}
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
            <h3>Tindak Lanjut & Pengingat WhatsApp Hari Ini</h3>
            <p>
              Daftar member dengan jadwal kelas hari ini yang membutuhkan pengiriman draf pesan WhatsApp.
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              className="btn-link-action"
              onClick={() => onNavigate('Reminders')}
              title="Buka halaman antrean pengingat lengkap"
            >
              Buka Halaman Pengingat Lengkap ({reminders.length}) &rarr;
            </button>
          )}
        </div>

        <ReminderTable
          rows={reminders}
          whatsapp={whatsapp}
          update={update}
          onOpenMessageDrafter={onOpenMessageDrafter}
          onOpenTimeline={onOpenTimeline}
        />
      </div>
    </div>
  );
}
