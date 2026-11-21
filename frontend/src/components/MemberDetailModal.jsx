import { useState, useEffect } from 'react';
import api from '../api/api';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  MessageCircle,
  FileText,
  Activity,
  History,
  AlertTriangle,
  Award,
  Sparkles,
  Info
} from 'lucide-react';

export default function MemberDetailModal({ isOpen, onClose, memberId, onOpenWhatsapp, onAddScheduleForMember }) {
  const [data, setData] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules'); // 'schedules' | 'history'

  useEffect(() => {
    if (isOpen && memberId) {
      setLoading(true);
      Promise.all([
        api.get(`/members/${memberId}/details`),
        api.get(`/inference/priority/${memberId}`).catch(() => null)
      ])
        .then(([detRes, prioRes]) => {
          setData(detRes.data);
          if (prioRes?.data) setPriorityData(prioRes.data);
        })
        .catch((err) => console.error('Gagal mengambil detail member:', err))
        .finally(() => setLoading(false));
    } else {
      setData(null);
      setPriorityData(null);
    }
  }, [isOpen, memberId]);

  if (!isOpen) return null;

  const member = data?.member;
  const stats = data?.stats;
  const schedules = data?.schedules || [];
  const history = data?.history || [];

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso)) + ' WIB';
    } catch {
      return iso;
    }
  };

  const getAttendanceLabel = (att) => {
    switch (att) {
      case 'present':
        return { text: 'Hadir', cls: 'att-present', icon: CheckCircle2 };
      case 'absent':
        return { text: 'Tidak Hadir', cls: 'att-absent', icon: XCircle };
      case 'rescheduled':
        return { text: 'Dijadwal Ulang', cls: 'att-rescheduled', icon: RefreshCw };
      default:
        return { text: 'Menunggu', cls: 'att-pending', icon: Clock };
    }
  };

  return (
    <div className="status-modal-backdrop" onClick={onClose}>
      <div
        className="detail-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="detail-modal-header">
          <div className="detail-header-info">
            <div className={`detail-avatar ${member?.membership_status === 'active' ? 'avatar-active' : 'avatar-inactive'}`}>
              <User size={24} />
            </div>
            <div>
              <div className="detail-title-row">
                <h3>{member?.name || 'Memuat...'}</h3>
                <span className={`badge-pill ${member?.membership_status === 'active' ? 'status-active' : 'status-inactive'}`}>
                  <span className="badge-dot"></span>
                  {member?.membership_status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
              <p className="detail-subtitle">ID Pelanggan: #{member?.id} &bull; Terdaftar sejak {member?.created_at ? new Date(member.created_at).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </div>
          <button type="button" className="status-modal-close-btn" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <RefreshCw size={24} className="spin-icon" />
            <p>Memuat profil dan riwayat pelanggan...</p>
          </div>
        ) : member ? (
          <div className="detail-modal-body">
            {/* Quick Contact & Info Grid */}
            <div className="member-info-cards-grid">
              <div className="info-mini-card">
                <span className="info-mini-label"><Phone size={13} /> Nomor WhatsApp</span>
                <strong className="info-mini-val">{member.phone}</strong>
              </div>
              <div className="info-mini-card">
                <span className="info-mini-label"><Mail size={13} /> Email</span>
                <strong className="info-mini-val">{member.email || 'Belum diisi'}</strong>
              </div>
              <div className="info-mini-card">
                <span className="info-mini-label"><Activity size={13} /> Tingkat Kehadiran</span>
                <strong className="info-mini-val text-primary">{stats?.attendanceRate ?? 100}%</strong>
              </div>
              <div className="info-mini-card">
                <span className="info-mini-label"><FileText size={13} /> Catatan Khusus</span>
                <span className="info-mini-val-note">{member.notes || 'Tidak ada catatan khusus.'}</span>
              </div>
            </div>

            {/* Inference API: Member Retention Risk Assessment */}
            {priorityData && (
              <div className={`member-priority-inference-card prio-${priorityData.priority}`}>
                <div className="prio-card-header">
                  <Sparkles size={16} />
                  <strong>Klasifikasi Retensi: Prioritas {priorityData.priority?.toUpperCase()} (Skor: {priorityData.score}/100)</strong>
                </div>
                <p className="prio-reason-text"><strong>Analisis Kondisi:</strong> {priorityData.reason}</p>
                <div className="prio-action-hint">
                  <Info size={13} />
                  <span><strong>Rekomendasi Tindakan:</strong> {priorityData.recommendedAction}</span>
                </div>
              </div>
            )}

            {/* Attendance Performance Summary */}
            <div className="attendance-stats-summary-card">
              <div className="summary-title-row">
                <div className="summary-title-left">
                  <Award size={16} className="text-primary" />
                  <strong>Statistik Kehadiran Sesi Latihan</strong>
                </div>
                <span className="summary-total-tag">Total {stats?.totalSchedules || 0} Sesi</span>
              </div>
              <div className="stats-pills-row">
                <div className="stat-pill-item pill-present">
                  <strong>{stats?.presentCount || 0}</strong>
                  <span>Hadir</span>
                </div>
                <div className="stat-pill-item pill-absent">
                  <strong>{stats?.absentCount || 0}</strong>
                  <span>Tidak Hadir</span>
                </div>
                <div className="stat-pill-item pill-rescheduled">
                  <strong>{stats?.rescheduledCount || 0}</strong>
                  <span>Rescheduled</span>
                </div>
                <div className="stat-pill-item pill-pending">
                  <strong>{stats?.pendingCount || 0}</strong>
                  <span>Menunggu</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="attendance-progress-bar-container">
                <div
                  className="attendance-progress-fill"
                  style={{ width: `${stats?.attendanceRate || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Tabs for Schedules and Communication History */}
            <div className="detail-tabs-bar">
              <button
                className={`detail-tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedules')}
              >
                <Calendar size={15} />
                <span>Riwayat Jadwal Kelas ({schedules.length})</span>
              </button>
              <button
                className={`detail-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={15} />
                <span>Riwayat Komunikasi ({history.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="detail-tab-content-area">
              {activeTab === 'schedules' ? (
                schedules.length > 0 ? (
                  <div className="detail-list-scroll">
                    {schedules.map((s) => {
                      const att = getAttendanceLabel(s.attendance);
                      const AttIcon = att.icon;
                      return (
                        <div key={s.id} className="detail-schedule-item">
                          <div className="detail-item-left">
                            <span className="class-pill-tag">{s.class_name}</span>
                            <span className="detail-item-time">
                              <Calendar size={13} /> {formatDateTime(s.starts_at)}
                            </span>
                          </div>
                          <span className={`badge-pill ${att.cls}`}>
                            <AttIcon size={13} /> {att.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-subtab-box">
                    <Calendar size={28} className="empty-icon-subtle" />
                    <p>Belum ada riwayat jadwal untuk pelanggan ini.</p>
                  </div>
                )
              ) : (
                history.length > 0 ? (
                  <div className="detail-list-scroll">
                    {history.map((h) => (
                      <div key={h.id} className="detail-history-item">
                        <div className="history-item-top">
                          <span className="history-action-badge">{h.action}</span>
                          <span className="history-time-stamp">{formatDateTime(h.created_at)}</span>
                        </div>
                        {h.class_name && (
                          <div className="history-class-ref">Sesi: <strong>{h.class_name}</strong></div>
                        )}
                        <p className="history-note-text">{h.note || 'Tidak ada catatan tambahan.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-subtab-box">
                    <History size={28} className="empty-icon-subtle" />
                    <p>Belum ada riwayat komunikasi tercatat untuk pelanggan ini.</p>
                  </div>
                )
              )}
            </div>

            {/* Action Bar */}
            <div className="detail-footer-actions">
              {onAddScheduleForMember && (
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => {
                    onClose();
                    onAddScheduleForMember(member);
                  }}
                >
                  <Calendar size={15} /> Buat Jadwal Untuk Member Ini
                </button>
              )}
              <a
                href={`https://wa.me/${member.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-action-wa"
              >
                <MessageCircle size={15} /> Chat WhatsApp
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
