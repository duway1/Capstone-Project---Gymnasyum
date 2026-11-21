import { useState, useMemo } from 'react';
import {
  CalendarPlus,
  Search,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  User,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  MessageCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import ScheduleDetailModal from '../components/ScheduleDetailModal';

const CLASS_SUGGESTIONS = [
  'Yoga Flow',
  'HIIT Cardio',
  'Body Pump',
  'Pilates',
  'Zumba Dance',
  'Strength Training'
];

export default function SchedulesPage({
  schedules = [],
  members = [],
  scheduleForm,
  setScheduleForm,
  scheduleEdit,
  setScheduleEdit,
  onSaveSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onAttendanceChange,
  onOpenMessageDrafter
}) {
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formOpen, setFormOpen] = useState(true);

  const isFormVisible = formOpen || Boolean(scheduleEdit);

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch =
        (s.member_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.class_name || '').toLowerCase().includes(search.toLowerCase());

      const matchAttendance =
        attendanceFilter === 'all' || s.attendance === attendanceFilter;

      let matchDate = true;
      if (s.starts_at) {
        const itemDateStr = new Date(s.starts_at).toISOString().split('T')[0];
        if (dateFilterMode === 'today') {
          matchDate = itemDateStr === todayStr;
        } else if (dateFilterMode === 'tomorrow') {
          matchDate = itemDateStr === tomorrowStr;
        } else if (dateFilterMode === 'custom' && customDate) {
          matchDate = itemDateStr === customDate;
        }
      }

      return matchSearch && matchAttendance && matchDate;
    });
  }, [
    schedules,
    search,
    attendanceFilter,
    dateFilterMode,
    customDate,
    todayStr,
    tomorrowStr
  ]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return (
        new Intl.DateTimeFormat('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(date) + ' WIB'
      );
    } catch {
      return isoString;
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'present':
        return { text: 'Hadir', cls: 'att-present', icon: CheckCircle2 };
      case 'absent':
        return { text: 'Tidak Hadir', cls: 'att-absent', icon: AlertCircle };
      case 'rescheduled':
        return { text: 'Dijadwal Ulang', cls: 'att-rescheduled', icon: RefreshCw };
      default:
        return { text: 'Menunggu', cls: 'att-pending', icon: HelpCircle };
    }
  };

  // Metric counts
  const totalCount = schedules.length;
  const todayCount = schedules.filter(
    (s) => s.starts_at && s.starts_at.startsWith(todayStr)
  ).length;
  const presentCount = schedules.filter((s) => s.attendance === 'present').length;
  const pendingCount = schedules.filter((s) => s.attendance === 'pending').length;

  return (
    <div className="schedules-page-container">
      {/* Form: Add / Edit Schedule with Collapse Toggle */}
      <div className={`form-section-card ${scheduleEdit ? 'editing-mode-card' : ''}`}>
        <div className="form-card-header">
          <div className="form-header-title">
            <div className="header-icon-box">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h3>
                {scheduleEdit
                  ? 'Edit Jadwal Kelas Latihan'
                  : 'Form Buat Jadwal Kelas Latihan Baru'}
              </h3>
              <p>
                {scheduleEdit
                  ? 'Perbarui data pelanggan, nama kelas, atau waktu pelaksanaan sesi.'
                  : 'Jadwalkan sesi kelas untuk pelanggan. Sistem otomatis membuat reminder WhatsApp dan alur pelacakannya.'}
              </p>
            </div>
          </div>

          <div className="form-header-right-actions">
            {scheduleEdit ? (
              <button
                type="button"
                className="btn-cancel-edit"
                onClick={() => {
                  setScheduleEdit(null);
                  setScheduleForm({
                    member_id: '',
                    class_name: '',
                    starts_at: '',
                    attendance: 'pending'
                  });
                }}
              >
                <X size={15} /> Batal Edit
              </button>
            ) : (
              <button
                type="button"
                className="btn-toggle-form"
                onClick={() => setFormOpen(!formOpen)}
                title={formOpen ? 'Ciutkan Form' : 'Buka Form Input'}
              >
                {formOpen ? (
                  <>
                    <ChevronUp size={16} />
                    <span>Ciutkan Form</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>+ Buka Form Jadwal</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {isFormVisible && (
          <form onSubmit={onSaveSchedule} className="schedule-input-form">
            <div className="form-grid-4">
              {/* Member selector */}
              <div className="form-input-wrapper">
                <label htmlFor="sched-member">Pilih Pelanggan Member</label>
                <select
                  id="sched-member"
                  required
                  value={scheduleForm.member_id}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, member_id: e.target.value })
                  }
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {members.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.name} ({m.phone}){' '}
                      {m.membership_status === 'inactive' ? '[Nonaktif]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Type (Group Class vs Private Coaching) */}
              <div className="form-input-wrapper">
                <label htmlFor="sched-type">Tipe Sesi Latihan</label>
                <select
                  id="sched-type"
                  value={scheduleForm.session_type || 'Group Class'}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, session_type: e.target.value })
                  }
                >
                  <option value="Group Class">👥 Group Class (Kelas Grup)</option>
                  <option value="Private Coaching">🏋️ Private Coaching (1-on-1)</option>
                </select>
              </div>

              {/* Instructor / Coach Name */}
              <div className="form-input-wrapper">
                <label htmlFor="sched-coach">Pelatih / Instruktur</label>
                <input
                  id="sched-coach"
                  type="text"
                  placeholder="Contoh: Coach Ryan / Coach Maya"
                  value={scheduleForm.instructor_name || ''}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, instructor_name: e.target.value })
                  }
                />
              </div>

              {/* Class Name input with quick suggestion chips */}
              <div className="form-input-wrapper">
                <label htmlFor="sched-class">Nama Sesi / Kelas</label>
                <input
                  id="sched-class"
                  type="text"
                  placeholder="Contoh: Yoga Flow / HIIT"
                  required
                  value={scheduleForm.class_name}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, class_name: e.target.value })
                  }
                />
                <div className="class-suggestions-chips">
                  {CLASS_SUGGESTIONS.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="suggestion-chip"
                      onClick={() =>
                        setScheduleForm({ ...scheduleForm, class_name: item })
                      }
                      title={`Gunakan kelas ${item}`}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starts At datetime picker */}
              <div className="form-input-wrapper">
                <label htmlFor="sched-time">Waktu & Tanggal Sesi</label>
                <input
                  id="sched-time"
                  type="datetime-local"
                  required
                  value={scheduleForm.starts_at}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, starts_at: e.target.value })
                  }
                />
              </div>

              {/* Attendance Status: Hanya tampil saat edit jadwal yang sudah ada */}
              {scheduleEdit && (
                <div className="form-input-wrapper">
                  <label htmlFor="sched-att">Status Presensi Kehadiran</label>
                  <select
                    id="sched-att"
                    value={scheduleForm.attendance}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, attendance: e.target.value })
                    }
                  >
                    <option value="pending">⏳ Menunggu (Pending)</option>
                    <option value="present">✅ Hadir (Present)</option>
                    <option value="absent">❌ Tidak Hadir (Absent)</option>
                    <option value="rescheduled">🔄 Dijadwal Ulang (Rescheduled)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-actions-bar">
              <button type="submit" className="btn-primary-action">
                <CalendarPlus size={16} />
                <span>
                  {scheduleEdit ? 'Simpan Perubahan Jadwal' : 'Tambahkan ke Jadwal'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Schedule Table Section */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Seluruh Jadwal Sesi Latihan ({filteredSchedules.length})</h3>
            {/* Quick summary chips */}
            <div className="schedule-summary-counters">
              <span className="counter-chip">
                Hari Ini: <strong>{todayCount}</strong>
              </span>
              <span className="counter-chip">
                Hadir: <strong>{presentCount}</strong>
              </span>
              <span className="counter-chip">
                Menunggu: <strong>{pendingCount}</strong>
              </span>
            </div>
          </div>

          <div className="controls-right">
            {/* Search Input */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari member atau nama kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearch('')}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Date Preset Filter Chips */}
            <div className="quick-filter-pills-row">
              <button
                type="button"
                className={`filter-pill-btn ${dateFilterMode === 'all' ? 'is-active' : ''}`}
                onClick={() => setDateFilterMode('all')}
              >
                Semua Tanggal
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${dateFilterMode === 'today' ? 'is-active' : ''}`}
                onClick={() => setDateFilterMode('today')}
              >
                Hari Ini ({todayCount})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${dateFilterMode === 'tomorrow' ? 'is-active' : ''}`}
                onClick={() => setDateFilterMode('tomorrow')}
              >
                Besok
              </button>
            </div>

            {/* Attendance Filter Dropdown */}
            <div className="filter-dropdown-wrapper">
              <Filter size={15} className="filter-icon" />
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
              >
                <option value="all">Semua Presensi</option>
                <option value="pending">Menunggu (Pending)</option>
                <option value="present">Hadir (Present)</option>
                <option value="absent">Tidak Hadir (Absent)</option>
                <option value="rescheduled">Dijadwal Ulang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Helper Banner for Clear Attendance Workflow */}
        <div className="schedule-attendance-helper-banner">
          <div className="helper-banner-icon">
            <CheckCircle2 size={16} />
          </div>
          <div className="helper-banner-text">
            <strong>Alur Kerja Presensi:</strong> Saat membuat jadwal, Anda <u>tidak perlu</u> memikirkan presensi karena jadwal adalah booking kelas di masa depan (otomatis berstatus <em>"Menunggu"</em>). Ketika member datang ke gym hari ini, cukup klik tombol <strong>[✅ Hadir]</strong> atau <strong>[❌ Absen]</strong> langsung pada baris tabel di bawah.
          </div>
        </div>

        {/* Schedule Table */}
        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Pelanggan Member</th>
                <th>Kelas Latihan</th>
                <th>Waktu & Tanggal Sesi</th>
                <th>Presensi di Gym (Hari-H)</th>
                <th className="text-right">Aksi Menu</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((s) => {
                  const att = getAttendanceBadge(s.attendance);
                  const AttIcon = att.icon;

                  return (
                    <tr key={s.id} className="table-row-hover">
                      <td>
                        <div
                          className="member-cell clickable-member"
                          onClick={() => setSelectedSchedule(s)}
                          title="Klik untuk melihat detail rincian jadwal & reminder"
                        >
                          <strong className="member-name">
                            {s.member_name || `Member #${s.member_id}`}
                          </strong>
                          {s.member_phone && (
                            <span className="member-phone">{s.member_phone}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="class-title-row">
                          <span className="class-pill-tag">{s.class_name}</span>
                          {s.session_type && (
                            <span className="badge-pill badge-session-type-sm">
                              {s.session_type}
                            </span>
                          )}
                        </div>
                        {s.instructor_name && (
                          <small className="class-instructor-sub">{s.instructor_name}</small>
                        )}
                      </td>
                      <td>
                        <div className="datetime-cell">
                          <Calendar size={13} className="cell-icon" />
                          <span>{formatDateTime(s.starts_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="attendance-cell-cluster">
                          <div className="attendance-current-badge">
                            <span className={`badge-pill ${att.cls}`}>
                              <AttIcon size={12} /> {att.text.split(' ')[0]}
                            </span>
                          </div>

                          {/* Quick 1-click attendance marking for pending sessions */}
                          {s.attendance === 'pending' ? (
                            <div className="quick-att-actions-row">
                              <button
                                type="button"
                                className="btn-quick-att-pill btn-quick-present"
                                onClick={() => onAttendanceChange(s.id, 'present')}
                                title="Member hadir latihan di gym"
                              >
                                <CheckCircle2 size={12} />
                                <span>Hadir</span>
                              </button>
                              <button
                                type="button"
                                className="btn-quick-att-pill btn-quick-absent"
                                onClick={() => onAttendanceChange(s.id, 'absent')}
                                title="Member tidak datang latihan"
                              >
                                <AlertCircle size={12} />
                                <span>Absen</span>
                              </button>
                            </div>
                          ) : (
                            <div className="attendance-select-wrapper">
                              <select
                                className={`select-attendance-pill ${att.cls}`}
                                value={s.attendance}
                                onChange={(e) => onAttendanceChange(s.id, e.target.value)}
                                title="Ubah status presensi"
                              >
                                <option value="present">✅ Hadir</option>
                                <option value="absent">❌ Tidak Hadir</option>
                                <option value="rescheduled">🔄 Rescheduled</option>
                                <option value="pending">⏳ Menunggu</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="actions-cluster">
                          {/* Detail Button */}
                          <button
                            type="button"
                            className="btn-table-action btn-action-view"
                            onClick={() => setSelectedSchedule(s)}
                            title="Lihat rincian jadwal & reminder"
                          >
                            <Eye size={14} />
                            <span>Detail</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            className="btn-table-action btn-action-edit"
                            onClick={() => {
                              onEditSchedule(s);
                              setFormOpen(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Edit data sesi latihan"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn-table-action btn-action-delete"
                            onClick={() => onDeleteSchedule(s.id)}
                            title="Hapus jadwal ini"
                          >
                            <Trash2 size={14} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state-card">
                      <Calendar size={38} className="empty-icon-subtle" />
                      <h4>Tidak Ada Jadwal Sesi Ditemukan</h4>
                      <p>
                        {search || dateFilterMode !== 'all' || attendanceFilter !== 'all'
                          ? 'Tidak ada jadwal yang cocok dengan kriteria pencarian dan filter Anda.'
                          : 'Belum ada jadwal sesi kelas latihan yang dibuat.'}
                      </p>
                      {(search || dateFilterMode !== 'all' || attendanceFilter !== 'all') && (
                        <button
                          type="button"
                          className="btn-empty-reset"
                          onClick={() => {
                            setSearch('');
                            setDateFilterMode('all');
                            setAttendanceFilter('all');
                          }}
                        >
                          Reset Filter & Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Detail Modal */}
      <ScheduleDetailModal
        isOpen={Boolean(selectedSchedule)}
        onClose={() => setSelectedSchedule(null)}
        schedule={selectedSchedule}
        onEdit={(s) => {
          onEditSchedule(s);
          setFormOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDelete={onDeleteSchedule}
        onAttendanceChange={(schedId, val) => {
          onAttendanceChange(schedId, val);
          setSelectedSchedule((prev) => (prev ? { ...prev, attendance: val } : null));
        }}
        onOpenMessageDrafter={onOpenMessageDrafter}
      />
    </div>
  );
}
