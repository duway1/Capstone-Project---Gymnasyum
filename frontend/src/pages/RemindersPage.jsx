import { useState, useMemo, useEffect } from 'react';
import api from '../api/api';
import ReminderTable from '../components/ReminderTable';
import PipelineBoard from '../components/PipelineBoard';
import ReminderTimelineModal from '../components/ReminderTimelineModal';
import MessageDrafterModal from '../components/MessageDrafterModal';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Filter,
  MessageSquare,
  Sparkles,
  Calendar,
  Columns,
  List,
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RemindersPage({
  reminders = [],
  allReminders = [],
  whatsapp,
  update,
  onRefreshData
}) {
  const [activeView, setActiveView] = useState('table'); // 'table' | 'pipeline' | 'guide'
  const [filter, setFilter] = useState('all');
  const [dateMode, setDateMode] = useState('today'); // 'today' | 'all' | 'custom'
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
  const [dateReminders, setDateReminders] = useState(reminders);
  const [loadingDate, setLoadingDate] = useState(false);

  // Modals state
  const [timelineReminderId, setTimelineReminderId] = useState(null);
  const [drafterReminderId, setDrafterReminderId] = useState(null);

  const todayStr = useMemo(() => getTodayStr(), []);
  const isToday = useMemo(() => dateMode === 'today' || (dateMode === 'custom' && selectedDate === todayStr), [dateMode, selectedDate, todayStr]);

  // Load reminders when dateMode or selectedDate changes
  useEffect(() => {
    if (dateMode === 'all') {
      if (allReminders && allReminders.length > 0) {
        setDateReminders(allReminders);
      } else {
        setLoadingDate(true);
        api.get('/reminders')
          .then((res) => setDateReminders(res.data))
          .catch((err) => console.error('Gagal mengambil semua reminder:', err))
          .finally(() => setLoadingDate(false));
      }
    } else if (dateMode === 'today') {
      setDateReminders(reminders);
    } else {
      setLoadingDate(true);
      api.get(`/reminders?date=${selectedDate}`)
        .then((res) => setDateReminders(res.data))
        .catch((err) => console.error('Gagal mengambil reminder tanggal:', err))
        .finally(() => setLoadingDate(false));
    }
  }, [dateMode, selectedDate, reminders, allReminders]);

  const handleDateShift = (days) => {
    setDateMode('custom');
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const formattedDateTitle = useMemo(() => {
    if (dateMode === 'all') {
      return 'Semua Tanggal Jadwal';
    }
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return selectedDate;
    }
  }, [dateMode, selectedDate]);

  // Metrics
  const highPriority = dateReminders.filter((r) => r.priority === 'high');
  const completed = dateReminders.filter((r) => r.status === 'sent' || r.status === 'responded');
  const pending = dateReminders.filter((r) => r.status === 'scheduled' || r.status === 'no_response');
  const responseRate =
    dateReminders.length > 0 ? Math.round((completed.length / dateReminders.length) * 100) : 100;

  const filteredReminders = useMemo(() => {
    if (filter === 'high') {
      return highPriority;
    }
    if (filter === 'pending') {
      return pending;
    }
    if (filter === 'completed') {
      return completed;
    }
    return dateReminders;
  }, [dateReminders, filter, highPriority, pending, completed]);

  return (
    <div className="reminders-page-container">
      {/* Top Banner Guide with User-Friendly Date Navigator */}
      <div className="reminders-banner-card">
        <div className="banner-left">
          <div className="banner-text">
            <div className="banner-tag-row">
              <span className={`live-date-pill ${isToday ? 'is-today-active' : ''}`}>
                <Calendar size={13} /> {isToday ? 'Hari Ini: ' : ''}
                {formattedDateTitle}
              </span>
              <span className="response-rate-pill">
                <TrendingUp size={13} /> Tingkat Konfirmasi: {responseRate}%
              </span>
            </div>
            <h3>Dashboard Pengingat & Follow-Up WhatsApp</h3>
            <p>
              Pantau jadwal kelas pelanggan, kirimkan template WhatsApp otomatis dengan prioritas pintar,
              dan lacak alur konfirmasi kehadiran member.
            </p>
          </div>
        </div>

        {/* User-Friendly Date Selector Controls */}
        <div className="banner-date-controls">
          <div className="date-control-header">
            <span className="control-label">PILIH TANGGAL SESI</span>
          </div>
          <div className="date-nav-buttons-cluster">
            <button
              type="button"
              className={`btn-date-today ${dateMode === 'today' ? 'active' : ''}`}
              onClick={() => {
                setDateMode('today');
                setSelectedDate(todayStr);
              }}
              title="Lihat Sesi Hari Ini"
            >
              {dateMode === 'today' && <span className="today-pulse-dot" />}
              <span>Hari Ini</span>
            </button>

            <button
              type="button"
              className={`btn-date-today ${dateMode === 'all' ? 'active' : ''}`}
              onClick={() => setDateMode('all')}
              title="Lihat Seluruh Pengingat Jadwal (Semua Tanggal)"
            >
              <span>Semua Tanggal</span>
            </button>

            <button
              type="button"
              className="btn-date-nav"
              onClick={() => handleDateShift(-1)}
              title="Sesi 1 Hari Sebelumnya"
            >
              <ChevronLeft size={16} />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              className="btn-date-nav"
              onClick={() => handleDateShift(1)}
              title="Sesi 1 Hari Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-picker-custom-box">
            <Calendar size={14} className="picker-icon" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setDateMode('custom');
                setSelectedDate(e.target.value);
              }}
              className="calendar-date-picker"
              title="Pilih tanggal spesifik"
            />
          </div>
        </div>
      </div>

      {/* Metric Summary Counters (Interactive Filter Buttons) */}
      <div className="reminder-metrics-grid">
        <div
          className={`metric-counter-card ${filter === 'all' ? 'active-metric' : ''}`}
          onClick={() => setFilter('all')}
          role="button"
          tabIndex={0}
          title="Tampilkan seluruh pengingat sesi"
        >
          <div className="metric-header">
            <Bell size={18} className="metric-icon-blue" />
            <span>Total Pengingat</span>
          </div>
          <strong className="metric-number">{dateReminders.length}</strong>
          <small>{isToday ? 'Sesi latihan hari ini' : 'Sesi pada tanggal ini'}</small>
          {filter === 'all' && <span className="metric-active-tag">Filter Aktif</span>}
        </div>

        <div
          className={`metric-counter-card ${filter === 'high' ? 'active-metric' : ''}`}
          onClick={() => setFilter('high')}
          role="button"
          tabIndex={0}
          title="Filter hanya yang berisiko mangkir"
        >
          <div className="metric-header">
            <AlertTriangle size={18} className="metric-icon-rose" />
            <span>Prioritas Tinggi</span>
          </div>
          <strong className="metric-number text-rose">{highPriority.length}</strong>
          <small>Absen &ge;2x dalam 14 hari</small>
          {filter === 'high' && <span className="metric-active-tag">Filter Aktif</span>}
        </div>

        <div
          className={`metric-counter-card ${filter === 'pending' ? 'active-metric' : ''}`}
          onClick={() => setFilter('pending')}
          role="button"
          tabIndex={0}
          title="Filter pengingat yang butuh konfirmasi"
        >
          <div className="metric-header">
            <Sparkles size={18} className="metric-icon-amber" />
            <span>Perlu Follow-Up</span>
          </div>
          <strong className="metric-number text-amber">{pending.length}</strong>
          <small>Belum terkirim / tanpa balasan</small>
          {filter === 'pending' && <span className="metric-active-tag">Filter Aktif</span>}
        </div>

        <div
          className={`metric-counter-card ${filter === 'completed' ? 'active-metric' : ''}`}
          onClick={() => setFilter('completed')}
          role="button"
          tabIndex={0}
          title="Filter pengingat yang sudah selesai/dibalas"
        >
          <div className="metric-header">
            <CheckCircle2 size={18} className="metric-icon-emerald" />
            <span>Selesai / Terkonfirmasi</span>
          </div>
          <strong className="metric-number text-emerald">{completed.length}</strong>
          <small>Terkirim & respon masuk</small>
          {filter === 'completed' && <span className="metric-active-tag">Filter Aktif</span>}
        </div>
      </div>

      {/* Modern User-Friendly View Switcher Tabs Bar */}
      <div className="reminders-view-tabs-bar">
        <div className="segmented-tab-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'table'}
            className={`segmented-tab-btn ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => setActiveView('table')}
          >
            <List size={16} />
            <span className="tab-text">Tabel Pengingat</span>
            <span className="tab-pill-badge">{filteredReminders.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'pipeline'}
            className={`segmented-tab-btn ${activeView === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveView('pipeline')}
          >
            <Columns size={16} />
            <span className="tab-text">Alur Status (Pipeline)</span>
            <span className="tab-pill-badge">{dateReminders.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'guide'}
            className={`segmented-tab-btn ${activeView === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveView('guide')}
          >
            <Info size={16} />
            <span className="tab-text">Panduan Prioritas & Draf</span>
          </button>
        </div>

        {activeView === 'table' && (
          <div className="tabs-filter-actions">
            {/* Quick Filter Pill Buttons */}
            <div className="quick-filter-pills-row">
              <button
                type="button"
                className={`filter-pill-btn ${filter === 'all' ? 'is-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Semua ({dateReminders.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-high ${filter === 'high' ? 'is-active' : ''}`}
                onClick={() => setFilter('high')}
              >
                Prioritas Tinggi ({highPriority.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-pending ${filter === 'pending' ? 'is-active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Perlu Follow-up ({pending.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-done ${filter === 'completed' ? 'is-active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Selesai ({completed.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content View */}
      {loadingDate ? (
        <div className="loading-container-card">
          <RefreshCw size={26} className="spin-icon" />
          <p>Memuat agenda pengingat tanggal {formattedDateTitle}...</p>
        </div>
      ) : activeView === 'table' ? (
        <div className="dashboard-section-card">
          <div className="section-table-header-bar">
            <div>
              <h3>Daftar Pengingat Sesi ({filteredReminders.length})</h3>
              <p>
                {filter === 'all'
                  ? `Menampilkan seluruh pengingat sesi pada tanggal ${formattedDateTitle}.`
                  : filter === 'high'
                    ? 'Menampilkan pelanggan dengan prioritas tinggi yang membutuhkan atensi khusus.'
                    : filter === 'pending'
                      ? 'Menampilkan pengingat yang belum dikirim atau belum dibalas.'
                      : 'Menampilkan pengingat yang telah berhasil dikonfirmasi/dibalas.'}
              </p>
            </div>
          </div>

          <ReminderTable
            rows={filteredReminders}
            whatsapp={whatsapp}
            update={(id, status, note) => {
              update(id, status, note);
              if (onRefreshData) onRefreshData();
            }}
            onOpenTimeline={(id) => setTimelineReminderId(id)}
            onOpenMessageDrafter={(id) => setDrafterReminderId(id)}
          />
        </div>
      ) : activeView === 'pipeline' ? (
        <div className="dashboard-section-card">
          <div className="pipeline-header-bar">
            <div>
              <h3>Pelacakan Alur Status Pengingat End-to-End</h3>
              <p>
                Pemantauan alur status pengingat secara linier: Terjadwal (Scheduled) &rarr; Pesan Terkirim (Sent) &rarr; Hasil Respon (Responded / No Response).
              </p>
            </div>
          </div>
          <PipelineBoard
            reminders={dateReminders}
            onOpenMessageDrafter={(id) => setDrafterReminderId(id)}
            onOpenTimeline={(id) => setTimelineReminderId(id)}
            onQuickUpdateStatus={(id, status) => update(id, status, '')}
          />
        </div>
      ) : (
        /* Guide Tab: Explanation of Priority Logic and Automated Messages */
        <div className="priority-guide-container">
          <div className="guide-card priority-high-guide">
            <div className="guide-card-header">
              <div className="guide-badge badge-high">PRIORITAS TINGGI (HIGH PRIORITY)</div>
              <h4>Pelanggan Berisiko Mangkir (At-Risk)</h4>
            </div>
            <div className="guide-body">
              <p>
                <strong>Kriteria Logika:</strong> Pelanggan yang memiliki riwayat ketidakhadiran (absent) &ge; 2 kali dalam 14 hari terakhir.
              </p>
              <p>
                <strong>Pendekatan:</strong> Pendekatan empati secara personal, menanyakan kendala waktu atau kesehatan, serta menawarkan opsi reschedule fleksibel tanpa beban.
              </p>
              <div className="sample-message-box">
                <strong>Contoh Template Pesan WhatsApp:</strong>
                <em>&ldquo;Halo [Nama]! Tim Gymnasyum ingin menyapa dan menanyakan kabar. Kami perhatikan Anda sempat melewatkan beberapa sesi [Kelas]. Apakah ada kendala jadwal? Sesi berikutnya dijadwalkan [Waktu]. Kami siap bantu sesuaikan jadwal agar tetap konsisten berolahraga!&rdquo;</em>
              </div>
            </div>
          </div>

          <div className="guide-card priority-medium-guide">
            <div className="guide-card-header">
              <div className="guide-badge badge-medium">PRIORITAS SEDANG (MEDIUM PRIORITY)</div>
              <h4>Perlu Konfirmasi Ulang / Tanpa Balasan</h4>
            </div>
            <div className="guide-body">
              <p>
                <strong>Kriteria Logika:</strong> Pelanggan yang memiliki 1 kali catatan absent dalam 14 hari, ATAU pengingat sebelumnya berstatus tanpa balasan (no_response), ATAU sesi saat ini ditandai absent.
              </p>
              <p>
                <strong>Pendekatan:</strong> Pengingat santun namun meminta kepastian hadir mengingat kuota ruang dan pelatih terbatas.
              </p>
              <div className="sample-message-box">
                <strong>Contoh Template Pesan WhatsApp:</strong>
                <em>&ldquo;Halo [Nama], kami dari Gymnasyum ingin mengonfirmasi kehadiran Anda di kelas [Kelas] pada [Waktu] WIB. Mengingat kuota peserta terbatas, mohon konfirmasi kesiapan Anda ya. Terima kasih!&rdquo;</em>
              </div>
            </div>
          </div>

          <div className="guide-card priority-low-guide">
            <div className="guide-card-header">
              <div className="guide-badge badge-low">PRIORITAS NORMAL (LOW PRIORITY)</div>
              <h4>Pelanggan Disiplin & Aktif</h4>
            </div>
            <div className="guide-body">
              <p>
                <strong>Kriteria Logika:</strong> Pelanggan aktif tanpa catatan mangkir dalam 14 hari terakhir.
              </p>
              <p>
                <strong>Pendekatan:</strong> Pengingat standar yang bersahabat dan mengingatkan perlengkapan olahraga atau botol minum.
              </p>
              <div className="sample-message-box">
                <strong>Contoh Template Pesan WhatsApp:</strong>
                <em>&ldquo;Halo [Nama], salam sehat dari Gymnasyum! Mengingatkan jadwal kelas [Kelas] Anda pada [Waktu] WIB. Siapkan botol minum dan perlengkapan latihan. Ditunggu di gym!&rdquo;</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End-to-End Timeline Tracker Modal */}
      <ReminderTimelineModal
        isOpen={Boolean(timelineReminderId)}
        onClose={() => setTimelineReminderId(null)}
        reminderId={timelineReminderId}
        onStatusUpdated={() => {
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* Message Drafter Modal (Priority Logic & Automated Follow-Up Messages) */}
      <MessageDrafterModal
        isOpen={Boolean(drafterReminderId)}
        onClose={() => setDrafterReminderId(null)}
        reminderId={drafterReminderId}
        onMessageSent={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
}
