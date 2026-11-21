import { useState } from 'react';
import api from '../api/api';
import {
  X,
  History,
  User,
  Phone,
  MessageCircle,
  FileText,
  Send,
  Users
} from 'lucide-react';

export default function ManualLogModal({ isOpen, onClose, members = [], onLogAdded }) {
  const [form, setForm] = useState({
    member_id: '',
    channel: 'whatsapp',
    action: 'Konfirmasi Hadir',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.member_id) {
      setErr('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setErr('');
    try {
      await api.post('/history', {
        member_id: Number(form.member_id),
        channel: form.channel,
        action: form.action,
        note: form.note
      });
      setForm({
        member_id: '',
        channel: 'whatsapp',
        action: 'Konfirmasi Hadir',
        note: ''
      });
      if (onLogAdded) onLogAdded();
      onClose();
    } catch (error) {
      setErr(error.response?.data?.error || 'Gagal menyimpan catatan komunikasi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="status-modal-backdrop" onClick={onClose}>
      <div
        className="status-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="status-modal-header">
          <div className="status-modal-title-box">
            <div className="status-modal-icon-badge">
              <History size={20} />
            </div>
            <div>
              <h3>Catat Riwayat Komunikasi Baru</h3>
              <p>Merekam interaksi langsung, histori pesan, atau respon dari pelanggan gym.</p>
            </div>
          </div>
          <button type="button" className="status-modal-close-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {err && <div className="error">{err}</div>}

        <form onSubmit={handleSubmit} className="status-modal-form">
          {/* Select Member */}
          <div className="form-input-wrapper">
            <label htmlFor="log-member">Pilih Pelanggan:</label>
            <select
              id="log-member"
              required
              value={form.member_id}
              onChange={(e) => setForm({ ...form, member_id: e.target.value })}
            >
              <option value="">-- Pilih Pelanggan --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            {/* Communication Channel */}
            <div className="form-input-wrapper">
              <label htmlFor="log-channel">Saluran Komunikasi:</label>
              <select
                id="log-channel"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Panggilan Telepon</option>
                <option value="in_person">Tatap Muka di Resepsionis</option>
                <option value="instagram">Instagram / Media Sosial</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            {/* Action / Outcome */}
            <div className="form-input-wrapper">
              <label htmlFor="log-action">Kategori / Tindakan:</label>
              <select
                id="log-action"
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
              >
                <option value="Konfirmasi Hadir">Konfirmasi Hadir</option>
                <option value="Minta Reschedule">Minta Reschedule Jadwal</option>
                <option value="Izin Berhalangan">Izin Berhalangan Hadir</option>
                <option value="Follow-Up Mangkir">Follow-Up Pelanggan Mangkir</option>
                <option value="Konsultasi Kelas">Konsultasi / Pertanyaan Kelas</option>
                <option value="Pesan Terkirim">Pesan Pengingat Terkirim</option>
                <option value="Komplain / Masukan">Komplain / Masukan Layanan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Note content */}
          <div className="form-input-wrapper">
            <label htmlFor="log-note">Isi Catatan & Respon Pelanggan:</label>
            <textarea
              id="log-note"
              rows={4}
              required
              placeholder="Contoh: Member mengonfirmasi akan hadir bersama rekan latihan jam 16.00 WIB..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            ></textarea>
          </div>

          <div className="status-modal-actions">
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary-action" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Riwayat Komunikasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
