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
  RefreshCw
} from 'lucide-react';

const CLASS_SUGGESTIONS = ['Yoga Flow', 'HIIT Cardio', 'Body Pump', 'Pilates', 'Zumba Dance', 'Strength Training'];

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
  onAttendanceChange
}) {
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch =
        (s.member_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.class_name || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        attendanceFilter === 'all' || s.attendance === attendanceFilter;
      return matchSearch && matchFilter;
    });
  }, [schedules, search, attendanceFilter]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date) + ' WIB';
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

  return (
    <div className="schedules-page-container">
      {/* Form: Add / Edit Schedule */}
      <div className={`form-section-card ${scheduleEdit ? 'editing-mode-card' : ''}`}>
        <div className="form-card-header">
          <div className="form-header-title">
            <div className="header-icon-box">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h3>{scheduleEdit ? 'Edit Jadwal Kelas' : 'Buat Jadwal Kelas Baru'}</h3>
              <p>
                {scheduleEdit
                  ? 'Perbarui member, nama kelas, atau waktu pelaksanaan sesi.'
                  : 'Jadwalkan kelas untuk member. Sistem otomatis membuat reminder WhatsApp.'}
              </p>
            </div>
          </div>
          {scheduleEdit && (
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
          )}
        </div>

        <form onSubmit={onSaveSchedule} className="schedule-input-form">
          <div className="form-grid-4">
            {/* Member selector */}
            <div className="form-input-wrapper">
              <label htmlFor="sched-member">Pilih Member</label>
              <select
                id="sched-member"
                required
                value={scheduleForm.member_id}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, member_id: e.target.value })
                }
              >
                <option value="">-- Pilih Member --</option>
                {members.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.name} ({m.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Name input */}
            <div className="form-input-wrapper">
              <label htmlFor="sched-class">Nama Kelas Gym</label>
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
                {CLASS_SUGGESTIONS.slice(0, 3).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => setScheduleForm({ ...scheduleForm, class_name: item })}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Starts At datetime picker */}
            <div className="form-input-wrapper">
              <label htmlFor="sched-time">Waktu & Tanggal Kelas</label>
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

            {/* Attendance initial value */}
            <div className="form-input-wrapper">
              <label htmlFor="sched-att">Status Kehadiran</label>
              <select
                id="sched-att"
                value={scheduleForm.attendance}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, attendance: e.target.value })
                }
              >
                <option value="pending">Menunggu (Pending)</option>
                <option value="present">Hadir (Present)</option>
                <option value="absent">Tidak Hadir (Absent)</option>
                <option value="rescheduled">Dijadwal Ulang (Rescheduled)</option>
              </select>
            </div>
          </div>

          <div className="form-actions-bar">
            <button type="submit" className="btn-primary-action">
              <CalendarPlus size={16} />
              <span>{scheduleEdit ? 'Simpan Perubahan Jadwal' : 'Tambahkan ke Jadwal'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Schedule Table Section */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Seluruh Jadwal Kelas ({schedules.length})</h3>
            <p className="controls-subtext">Semua jadwal sesi latihan gym yang telah dibuat.</p>
          </div>

          <div className="controls-right">
            {/* Search Input */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari member atau kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="filter-dropdown-wrapper">
              <Filter size={15} className="filter-icon" />
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
              >
                <option value="all">Semua Presensi</option>
                <option value="pending">Menunggu</option>
                <option value="present">Hadir</option>
                <option value="absent">Tidak Hadir</option>
                <option value="rescheduled">Dijadwal Ulang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Kelas Gym</th>
                <th>Jadwal Sesi</th>
                <th>Status Presensi</th>
                <th className="text-right">Aksi</th>
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
                        <div className="member-cell">
                          <strong className="member-name">{s.member_name || `Member #${s.member_id}`}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="class-pill-tag">{s.class_name}</span>
                      </td>
                      <td>
                        <div className="datetime-cell">
                          <Calendar size={13} className="cell-icon" />
                          <span>{formatDateTime(s.starts_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="attendance-select-wrapper">
                          <select
                            className={`select-attendance-pill ${att.cls}`}
                            value={s.attendance}
                            onChange={(e) => onAttendanceChange(s.id, e.target.value)}
                          >
                            <option value="pending">Menunggu</option>
                            <option value="present">Hadir</option>
                            <option value="absent">Tidak Hadir</option>
                            <option value="rescheduled">Dijadwal Ulang</option>
                          </select>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="actions-cluster">
                          <button
                            className="btn-table-action btn-action-edit"
                            onClick={() => {
                              onEditSchedule(s);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Edit jadwal ini"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
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
                      <Calendar size={36} className="empty-icon-subtle" />
                      <h4>Tidak Ada Jadwal Ditemukan</h4>
                      <p>
                        {search
                          ? `Tidak ada jadwal yang cocok dengan kata kunci "${search}".`
                          : 'Belum ada jadwal kelas yang dibuat. Buat jadwal sesi baru pada form di atas.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
