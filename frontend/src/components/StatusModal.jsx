import { useState, useEffect } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Sparkles,
  Check
} from 'lucide-react';

const STATUS_OPTIONS = [
  {
    id: 'sent',
    label: 'Terkirim',
    title: 'Pesan Terkirim',
    desc: 'Pengingat telah dikirimkan ke WhatsApp member.',
    icon: Send,
    colorClass: 'option-sent'
  },
  {
    id: 'responded',
    label: 'Merespons',
    title: 'Member Merespons',
    desc: 'Member telah membalas atau mengonfirmasi kehadiran.',
    icon: CheckCircle2,
    colorClass: 'option-responded'
  },
  {
    id: 'no_response',
    label: 'Tanpa Balasan',
    title: 'Tanpa Balasan',
    desc: 'Pesan terkirim tetapi belum mendapat tanggapan.',
    icon: AlertCircle,
    colorClass: 'option-no-response'
  }
];

const QUICK_NOTES = [
  'Konfirmasi Hadir',
  'Minta Reschedule Jadwal',
  'Sudah di-chat via WhatsApp',
  'Nomor tidak aktif / Centang 1',
  'Izin berhalangan hadir'
];

export default function StatusModal({
  isOpen,
  onClose,
  reminder,
  initialStatus = 'sent',
  onSave
}) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(initialStatus || 'sent');
      setNote(reminder?.note || '');
    }
  }, [isOpen, initialStatus, reminder]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reminder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(reminder.id, status, note);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuickNote = (text) => {
    setNote((prev) => (prev ? `${prev}, ${text}` : text));
  };

  return (
    <div className="status-modal-backdrop" onClick={onClose}>
      <div
        className="status-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="status-modal-header">
          <div className="status-modal-title-box">
            <div className="status-modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Update Status Tindak Lanjut</h3>
              <p>Perbarui status pengingat untuk mencatat progres komunikasi dengan member.</p>
            </div>
          </div>
          <button
            type="button"
            className="status-modal-close-btn"
            onClick={onClose}
            title="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member & Class Info Tag */}
        <div className="status-modal-member-banner">
          <div className="member-banner-item">
            <User size={15} className="banner-icon" />
            <span>Member: <strong>{reminder.name}</strong></span>
          </div>
          <div className="member-banner-divider">&bull;</div>
          <div className="member-banner-item">
            <Calendar size={15} className="banner-icon" />
            <span>Kelas: <strong>{reminder.class_name}</strong></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="status-modal-form">
          {/* Status Selection Cards */}
          <div className="status-selection-section">
            <label className="section-label">PILIH STATUS TINDAK LANJUT</label>
            <div className="status-options-grid">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`status-option-card ${opt.colorClass} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    onClick={() => setStatus(opt.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="option-top">
                      <div className="option-icon-box">
                        <Icon size={18} />
                      </div>
                      <div className="option-check-circle">
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <strong className="option-title">{opt.title}</strong>
                    <p className="option-desc">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Input Area */}
          <div className="status-note-section">
            <div className="note-label-row">
              <label htmlFor="status-note-input" className="section-label">
                CATATAN TINDAK LANJUT (OPSIONAL)
              </label>
              <FileText size={14} className="note-label-icon" />
            </div>

            <textarea
              id="status-note-input"
              className="status-note-textarea"
              rows={3}
              placeholder="Contoh: Member mengonfirmasi hadir pukul 19:00, atau minta ganti hari Jumat..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {/* Quick Note Chips */}
            <div className="quick-note-chips-container">
              <small className="chips-title">Pilihan Cepat:</small>
              <div className="chips-list">
                {QUICK_NOTES.map((qn) => (
                  <button
                    key={qn}
                    type="button"
                    className="quick-note-chip"
                    onClick={() => handleAddQuickNote(qn)}
                  >
                    + {qn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="status-modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading}
            >
              {loading ? (
                'Menyimpan...'
              ) : (
                <>
                  <Check size={16} />
                  <span>Simpan Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
