import { useState, useEffect } from 'react';
import api from '../api/api';
import {
  X,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Phone,
  Check
} from 'lucide-react';

const STAGES = [
  { id: 'scheduled', label: '1. Terjadwal', title: 'Terjadwal di Sistem', desc: 'Jadwal sesi dibuat & reminder otomatis disiapkan.', icon: Clock },
  { id: 'sent', label: '2. Pesan Terkirim', title: 'Pesan Terkirim via WA', desc: 'Draf follow-up terformat dikirim ke WhatsApp member.', icon: Send },
  { id: 'resolved', label: '3. Hasil / Respon', title: 'Tanggapan Pelanggan', desc: 'Member merespons hadir/izin atau tanpa balasan.', icon: CheckCircle2 }
];

export default function ReminderTimelineModal({
  isOpen,
  onClose,
  reminderId,
  onStatusUpdated
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('sent');
  const [newNote, setNewNote] = useState('');

  const loadTimeline = () => {
    if (!reminderId) return;
    setLoading(true);
    api.get(`/reminders/${reminderId}/timeline`)
      .then((res) => {
        setData(res.data);
        const cur = res.data.reminder?.status;
        if (cur === 'scheduled') setNewStatus('sent');
        else if (cur === 'sent') setNewStatus('responded');
        else setNewStatus('responded');
      })
      .catch((err) => console.error('Gagal mengambil riwayat alur status:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && reminderId) {
      loadTimeline();
      setNewNote('');
    } else {
      setData(null);
    }
  }, [isOpen, reminderId]);

  if (!isOpen) return null;

  const reminder = data?.reminder;
  const timeline = data?.timeline || [];

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

  const getStageIndex = (status) => {
    switch (status) {
      case 'scheduled': return 0;
      case 'sent':
      case 'opened': return 1;
      case 'responded':
      case 'no_response': return 2;
      default: return 0;
    }
  };

  const currentStageIndex = reminder ? getStageIndex(reminder.status) : 0;

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!reminder) return;
    setUpdating(true);
    try {
      await api.patch(`/reminders/${reminder.id}`, {
        status: newStatus,
        note: newNote
      });
      setNewNote('');
      loadTimeline();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="status-modal-backdrop" onClick={onClose}>
      <div
        className="timeline-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="timeline-modal-header">
          <div className="timeline-header-title">
            <div className="timeline-icon-badge">
              <Sparkles size={22} />
            </div>
            <div>
              <h3>Pelacakan Alur Status Reminder End-to-End</h3>
              <p>Pemantauan alur status pengingat: Terjadwal (Scheduled) &rarr; Terkirim (Sent) &rarr; Hasil Respon (Responded / No Response).</p>
            </div>
          </div>
          <button type="button" className="status-modal-close-btn" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <RefreshCw size={24} className="spin-icon" />
            <p>Memuat rekam jejak alur pengingat...</p>
          </div>
        ) : reminder ? (
          <div className="timeline-modal-body">
            {/* Reminder Summary Banner */}
            <div className="timeline-summary-banner">
              <div className="summary-banner-item">
                <User size={15} className="banner-icon" />
                <span>Pelanggan: <strong>{reminder.name}</strong> ({reminder.phone})</span>
              </div>
              <div className="summary-banner-item">
                <Calendar size={15} className="banner-icon" />
                <span>Kelas: <strong>{reminder.class_name}</strong></span>
              </div>
              <div className="summary-banner-item">
                <Clock size={15} className="banner-icon" />
                <span>Waktu Sesi: <strong>{formatDateTime(reminder.starts_at)}</strong></span>
              </div>
              <div className="summary-banner-item">
                <span className={`badge-pill priority-${reminder.priority}`}>
                  Prioritas {reminder.priority?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Stepper Visual Horizontal (3 Stages) */}
            <div className="end-to-end-stepper-container">
              <div className="stepper-track">
                {STAGES.map((stg, idx) => {
                  const Icon = stg.icon;
                  const isCompleted = idx < currentStageIndex || (idx === 2 && (reminder.status === 'responded' || reminder.status === 'no_response'));
                  const isCurrent = idx === currentStageIndex;

                  let stageColor = 'step-upcoming';
                  if (isCurrent) stageColor = 'step-current';
                  else if (isCompleted) stageColor = 'step-completed';

                  return (
                    <div key={stg.id} className={`stepper-node ${stageColor}`}>
                      <div className="stepper-circle">
                        {isCompleted && !isCurrent ? <Check size={16} /> : <Icon size={16} />}
                      </div>
                      <div className="stepper-label-box">
                        <strong>{stg.label}</strong>
                        <small>{isCurrent ? 'Sedang di tahap ini' : isCompleted ? 'Selesai' : 'Menunggu'}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Two Column Layout: Transition Form & Audit Trail */}
            <div className="timeline-two-col-grid">
              {/* Left Column: Quick Transition Form */}
              <div className="timeline-col-action">
                <div className="timeline-section-title">
                  <ArrowRight size={16} className="text-primary" />
                  <strong>Transisi Alur Status Selanjutnya</strong>
                </div>
                <form onSubmit={handleUpdateStatus} className="timeline-action-form">
                  <div className="form-input-wrapper">
                    <label>Pilih Status Baru:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="timeline-status-select"
                    >
                      <option value="sent">2. Pesan Terkirim via WA (sent)</option>
                      <option value="responded">3. Pelanggan Merespons Hadir (responded)</option>
                      <option value="no_response">3. Tanpa Balasan / Butuh Follow-Up 2 (no_response)</option>
                      <option value="scheduled">1. Kembalikan ke Terjadwal (scheduled)</option>
                    </select>
                  </div>

                  <div className="form-input-wrapper">
                    <label>Catatan Riwayat / Keterangan:</label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Member membalas konfirmasi hadir jam 19.00..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-action full-width"
                    disabled={updating}
                  >
                    {updating ? 'Menyimpan...' : 'Perbarui Status Alur Pengingat'}
                  </button>
                </form>
              </div>

              {/* Right Column: Historical Audit Trail */}
              <div className="timeline-col-history">
                <div className="timeline-section-title">
                  <Clock size={16} className="text-primary" />
                  <strong>Audit Trail & Rekam Jejak Alur ({timeline.length})</strong>
                </div>

                <div className="audit-trail-list">
                  {timeline.length > 0 ? (
                    timeline.map((item) => (
                      <div key={item.id} className="audit-item">
                        <div className="audit-bullet"></div>
                        <div className="audit-body">
                          <div className="audit-header">
                            <span className="audit-action-tag">{item.action}</span>
                            <span className="audit-time">{formatDateTime(item.created_at)}</span>
                          </div>
                          {item.channel && (
                            <span className="audit-channel-tag">Saluran: {item.channel}</span>
                          )}
                          <p className="audit-note">{item.note || 'Status diperbarui oleh staf.'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="audit-empty">
                      <Clock size={24} className="empty-icon-subtle" />
                      <p>Belum ada catatan transisi tambahan pada pengingat ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
