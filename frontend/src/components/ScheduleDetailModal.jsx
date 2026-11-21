import { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Edit2,
  Trash2,
  MessageCircle,
  Tag
} from 'lucide-react';

export default function ScheduleDetailModal({
  isOpen,
  onClose,
  schedule,
  onEdit,
  onDelete,
  onAttendanceChange,
  onOpenMessageDrafter
}) {
  if (!isOpen || !schedule) return null;

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso)) + ' WIB';
    } catch {
      return iso;
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'present':
        return { text: 'Hadir (Present)', cls: 'att-present', icon: CheckCircle2 };
      case 'absent':
        return { text: 'Tidak Hadir (Absent)', cls: 'att-absent', icon: AlertCircle };
      case 'rescheduled':
        return { text: 'Dijadwal Ulang (Rescheduled)', cls: 'att-rescheduled', icon: RefreshCw };
      default:
        return { text: 'Menunggu (Pending)', cls: 'att-pending', icon: HelpCircle };
    }
  };

  const getReminderStatusBadge = (status) => {
    switch (status) {
      case 'sent':
      case 'opened':
        return { text: 'Pesan Terkirim (Sent)', cls: 'status-sent' };
      case 'responded':
        return { text: 'Member Merespons (Responded)', cls: 'status-responded' };
      case 'no_response':
        return { text: 'Tanpa Balasan (No Response)', cls: 'status-no-response' };
      default:
        return { text: 'Terjadwal (Scheduled)', cls: 'status-scheduled' };
    }
  };

  const att = getAttendanceBadge(schedule.attendance);
  const AttIcon = att.icon;
  const remStatus = getReminderStatusBadge(schedule.reminder_status);

  return (
    <div className="status-modal-backdrop" onClick={onClose}>
      <div
        className="detail-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="detail-modal-header">
          <div className="detail-header-info">
            <div className="schedule-header-icon-box">
              <Calendar size={24} />
            </div>
            <div>
              <div className="detail-title-row">
                <h3>{schedule.class_name}</h3>
                <span className={`badge-pill ${att.cls}`}>
                  <AttIcon size={13} /> {att.text}
                </span>
              </div>
              <p className="detail-subtitle">ID Jadwal: #{schedule.id}</p>
            </div>
          </div>
          <button type="button" className="status-modal-close-btn" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="detail-modal-body">
          {/* Main Grid */}
          <div className="schedule-detail-grid">
            {/* Member Info */}
            <div className="schedule-info-card">
              <div className="info-card-header">
                <User size={16} className="text-primary" />
                <strong>Informasi Pelanggan</strong>
              </div>
              <div className="info-card-body">
                <div className="info-row">
                  <span className="label">Nama Member:</span>
                  <strong className="val">{schedule.member_name || `Member #${schedule.member_id}`}</strong>
                </div>
                {schedule.member_phone && (
                  <div className="info-row">
                    <span className="label">No WhatsApp:</span>
                    <span className="val phone-text">{schedule.member_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Time & Session Info */}
            <div className="schedule-info-card">
              <div className="info-card-header">
                <Clock size={16} className="text-primary" />
                <strong>Jadwal & Waktu Sesi</strong>
              </div>
              <div className="info-card-body">
                <div className="info-row">
                  <span className="label">Waktu Mulai:</span>
                  <strong className="val">{formatDateTime(schedule.starts_at)}</strong>
                </div>
                <div className="info-row">
                  <span className="label">Kelas / Sesi:</span>
                  <span className="val class-pill-tag">{schedule.class_name}</span>
                </div>
                {schedule.session_type && (
                  <div className="info-row">
                    <span className="label">Tipe Sesi:</span>
                    <span className="val badge-session-type">{schedule.session_type}</span>
                  </div>
                )}
                {schedule.instructor_name && (
                  <div className="info-row">
                    <span className="label">Instruktur / Coach:</span>
                    <strong className="val">{schedule.instructor_name}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Attendance Selector */}
          <div className="schedule-attendance-control-card">
            <div className="control-header">
              <Tag size={16} />
              <span>Perbarui Status Kehadiran Sesi</span>
            </div>
            <div className="attendance-options-row">
              {['pending', 'present', 'absent', 'rescheduled'].map((val) => {
                const isSelected = schedule.attendance === val;
                const opt = getAttendanceBadge(val);
                const OptIcon = opt.icon;
                return (
                  <button
                    key={val}
                    type="button"
                    className={`btn-attendance-option ${isSelected ? 'active ' + opt.cls : ''}`}
                    onClick={() => onAttendanceChange && onAttendanceChange(schedule.id, val)}
                  >
                    <OptIcon size={14} />
                    <span>{opt.text.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linked Reminder Card */}
          <div className="schedule-reminder-link-card">
            <div className="reminder-link-header">
              <div className="reminder-link-title">
                <Bell size={16} className="text-amber" />
                <strong>Status Pengingat Otomatis (Reminder)</strong>
              </div>
              <span className={`badge-pill ${remStatus.cls}`}>
                {remStatus.text}
              </span>
            </div>
            <p className="reminder-link-desc">
              Sistem otomatis membuat entri pengingat WhatsApp untuk sesi ini.
              {schedule.reminder_note && (
                <span className="reminder-note-highlight"> Catatan: {schedule.reminder_note}</span>
              )}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="detail-footer-actions">
            <div className="left-actions">
              <button
                type="button"
                className="btn-table-action btn-action-delete"
                onClick={() => {
                  onClose();
                  onDelete && onDelete(schedule.id);
                }}
              >
                <Trash2 size={15} /> Hapus Jadwal
              </button>
              <button
                type="button"
                className="btn-table-action btn-action-edit"
                onClick={() => {
                  onClose();
                  onEdit && onEdit(schedule);
                }}
              >
                <Edit2 size={15} /> Edit Data
              </button>
            </div>
            {onOpenMessageDrafter && schedule.reminder_id && (
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  onClose();
                  onOpenMessageDrafter(schedule.reminder_id);
                }}
              >
                <MessageCircle size={15} /> Buka Draf Pesan Pengingat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
