import { useState, useEffect } from 'react';
import api from '../api/api';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  RefreshCw,
  User,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function MessageDrafterModal({
  isOpen,
  onClose,
  reminderId,
  onMessageSent
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoMarkSent, setAutoMarkSent] = useState(true);

  useEffect(() => {
    if (isOpen && reminderId) {
      setLoading(true);
      setCopied(false);
      api.get(`/reminders/${reminderId}/message`)
        .then((res) => {
          setData(res.data);
          setSelectedTemplateId(res.data.recommendedTemplateId);
          setCustomMessage(res.data.defaultMessage);
        })
        .catch((err) => {
          console.warn('Gagal memuat template pesan dari backend, menggunakan template bawaan:', err);
          const fallbackData = {
            member: { name: 'Member Gymnasyum', phone: '081234567890' },
            schedule: { class_name: 'Sesi Latihan Kebugaran', session_type: 'Group Class', instructor_name: 'Coach Gymnasyum', starts_at: new Date().toISOString() },
            priority: 'medium',
            recommendedTemplateId: 'template_standard',
            defaultMessage: 'Halo Member Gymnasyum! Mengingatkan jadwal latihan Anda hari ini di Gymnasyum. Sampai jumpa di sesi latihan!',
            whatsappLink: 'https://wa.me/6281234567890?text=' + encodeURIComponent('Halo Member Gymnasyum! Mengingatkan jadwal latihan Anda hari ini di Gymnasyum.'),
            templates: [
              { id: 'template_standard', name: 'Pengingat Standar Ramah', text: 'Halo {nama}! Mengingatkan jadwal latihan {kelas} hari ini di Gymnasyum. Sampai jumpa di gym!' },
              { id: 'template_high_risk', name: 'Pendekatan Personal & Empati', text: 'Halo {nama}! Kami rindu melihat Anda di gym. Apakah ada kendala pada jadwal latihan?' }
            ]
          };
          setData(fallbackData);
          setSelectedTemplateId('template_standard');
          setCustomMessage(fallbackData.defaultMessage);
        })
        .finally(() => setLoading(false));
    } else {
      setData(null);
      setCustomMessage('');
    }
  }, [isOpen, reminderId]);

  if (!isOpen) return null;

  const reminder = data?.reminder;
  const templates = data?.templates || [];

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setCustomMessage(tmpl.compiledText);
  };

  const handleCopyText = async () => {
    if (!customMessage) return;
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSendWhatsapp = async () => {
    if (!data?.phone) return;
    const url = `https://wa.me/${data.phone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Update status reminder menjadi sent setelah membuka link WhatsApp
    if (autoMarkSent && reminder) {
      try {
        await api.patch(`/reminders/${reminder.id}`, {
          status: 'sent',
          note: `Pesan dikirim via WhatsApp Web (Template: ${selectedTemplateId})`
        });
        if (onMessageSent) onMessageSent();
      } catch (e) {
        console.error('Gagal memperbarui status pengingat:', e);
      }
    }

    onClose();
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'high':
        return { text: 'Prioritas Tinggi (High)', cls: 'priority-high', desc: 'Member sering absen, gunakan pendekatan empati & tawarkan solusi.' };
      case 'medium':
        return { text: 'Prioritas Sedang (Medium)', cls: 'priority-medium', desc: 'Konfirmasi kuota kelas & minta kepastian kehadiran.' };
      default:
        return { text: 'Prioritas Normal (Low)', cls: 'priority-low', desc: 'Member disiplin, gunakan pengingat santun standar.' };
    }
  };

  const pBadge = getPriorityBadge(reminder?.priority);

  return (
    <div className="status-modal-backdrop" onClick={onClose}>
      <div
        className="drafter-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="drafter-modal-header">
          <div className="drafter-header-title">
            <div className="drafter-icon-badge">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3>Generator Pesan Otomatis & Follow-Up WhatsApp</h3>
              <p>Menyiapkan daftar draf pesan follow-up terformat sesuai klasifikasi prioritas pelanggan.</p>
            </div>
          </div>
          <button type="button" className="status-modal-close-btn" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <RefreshCw size={24} className="spin-icon" />
            <p>Mempersiapkan template pesan otomatis & klasifikasi prioritas...</p>
          </div>
        ) : reminder ? (
          <div className="drafter-modal-body">
            {/* Priority & Rule Explanation Card */}
            <div className={`priority-rationale-box ${pBadge.cls}-bg`}>
              <div className="rationale-top">
                <span className={`badge-pill ${pBadge.cls}`}>
                  {pBadge.text}
                </span>
                <span className="member-name-tag">
                  <User size={13} /> {reminder.name} ({reminder.phone})
                </span>
                {reminder.session_type && (
                  <span className="badge-pill badge-session-type">
                    {reminder.session_type}
                  </span>
                )}
              </div>
              <div className="rationale-reason">
                <Info size={14} className="info-icon" />
                <span>
                  <strong>Alasan Prioritas:</strong> {reminder.priority_reason || pBadge.desc}
                </span>
              </div>
            </div>

            {/* Template Selector Section */}
            <div className="template-selector-section">
              <label className="section-label">PILIH DARI DAFTAR TEMPLATE PESAN FOLLOW-UP:</label>
              <div className="template-chips-grid">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      className={`template-chip-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectTemplate(tmpl)}
                    >
                      <div className="template-chip-header">
                        <strong>{tmpl.title}</strong>
                        {tmpl.isRecommended && (
                          <span className="recommended-tag">
                            <Sparkles size={11} /> Rekomendasi
                          </span>
                        )}
                      </div>
                      <small className="template-chip-desc">{tmpl.description}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Message Textarea Editor */}
            <div className="message-editor-section">
              <div className="editor-header">
                <label className="section-label">PRATINJAU & EDIT ISI PESAN (SIAP KIRIM):</label>
                <button
                  type="button"
                  className="btn-copy-preview"
                  onClick={handleCopyText}
                  title="Salin pesan ke clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald" />
                      <span className="text-emerald">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Salin Pesan</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                className="message-live-textarea"
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Tulis pesan pengingat..."
              ></textarea>
            </div>

            {/* Checkbox auto mark */}
            <div className="auto-mark-checkbox-wrapper">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoMarkSent}
                  onChange={(e) => setAutoMarkSent(e.target.checked)}
                />
                <span>Otomatis ubah status alur menjadi <strong>"Pesan Terkirim (Sent)"</strong> dan rekam ke riwayat komunikasi.</span>
              </label>
            </div>

            {/* Footer Action Buttons */}
            <div className="drafter-footer-actions">
              <button type="button" className="btn-secondary-action" onClick={onClose}>
                Batal
              </button>
              <button
                type="button"
                className="btn-primary-action btn-send-wa-large"
                onClick={handleSendWhatsapp}
              >
                <ExternalLink size={16} />
                <span>Buka WhatsApp (wa.me) & Tandai Terkirim</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
