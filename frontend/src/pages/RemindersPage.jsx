import { useState, useMemo } from 'react';
import ReminderTable from '../components/ReminderTable';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Filter,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function RemindersPage({ reminders = [], whatsapp, update }) {
  const [filter, setFilter] = useState('all');

  const highPriority = reminders.filter((r) => r.priority === 'high');
  const completed = reminders.filter((r) => r.status === 'sent' || r.status === 'responded');
  const pending = reminders.filter((r) => r.status === 'scheduled' || r.status === 'no_response' || r.status === 'opened');

  const filteredReminders = useMemo(() => {
    if (filter === 'high') {
      return reminders.filter((r) => r.priority === 'high');
    }
    if (filter === 'pending') {
      return pending;
    }
    if (filter === 'completed') {
      return completed;
    }
    return reminders;
  }, [reminders, filter, pending, completed]);

  return (
    <div className="reminders-page-container">
      {/* Top Banner Guide */}
      <div className="reminders-banner-card">
        <div className="banner-icon-circle">
          <MessageSquare size={24} />
        </div>
        <div className="banner-text">
          <h3>Antrean Pengingat WhatsApp Hari Ini</h3>
          <p>
            Memberi tahu member tentang jadwal kelas mereka hari ini untuk meminimalisir ketidakhadiran.
            Prioritas tinggi otomatis diberikan kepada member yang memiliki riwayat ketidakhadiran dalam 14 hari terakhir.
          </p>
        </div>
      </div>

      {/* Metric summary counters */}
      <div className="reminder-metrics-grid">
        <div
          className={`metric-counter-card ${filter === 'all' ? 'active-metric' : ''}`}
          onClick={() => setFilter('all')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-header">
            <Bell size={18} className="metric-icon-blue" />
            <span>Semua Antrean</span>
          </div>
          <strong className="metric-number">{reminders.length}</strong>
          <small>Kelas hari ini</small>
        </div>

        <div
          className={`metric-counter-card ${filter === 'high' ? 'active-metric' : ''}`}
          onClick={() => setFilter('high')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-header">
            <AlertTriangle size={18} className="metric-icon-rose" />
            <span>Prioritas Tinggi</span>
          </div>
          <strong className="metric-number text-rose">{highPriority.length}</strong>
          <small>Sering absen (&ge;2x)</small>
        </div>

        <div
          className={`metric-counter-card ${filter === 'pending' ? 'active-metric' : ''}`}
          onClick={() => setFilter('pending')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-header">
            <Sparkles size={18} className="metric-icon-amber" />
            <span>Perlu Dikirim</span>
          </div>
          <strong className="metric-number text-amber">{pending.length}</strong>
          <small>Belum terkirim / follow-up</small>
        </div>

        <div
          className={`metric-counter-card ${filter === 'completed' ? 'active-metric' : ''}`}
          onClick={() => setFilter('completed')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-header">
            <CheckCircle2 size={18} className="metric-icon-emerald" />
            <span>Selesai Ditindaklanjuti</span>
          </div>
          <strong className="metric-number text-emerald">{completed.length}</strong>
          <small>Terkirim / merespons</small>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Pengingat ({filteredReminders.length})</h3>
            <p className="controls-subtext">Klik tombol WhatsApp untuk membuat draf pesan pengingat resmi secara instan.</p>
          </div>

          <div className="controls-right">
            <div className="filter-dropdown-wrapper">
              <Filter size={15} className="filter-icon" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Semua Pengingat ({reminders.length})</option>
                <option value="high">Prioritas Tinggi Saja ({highPriority.length})</option>
                <option value="pending">Belum Dikirim ({pending.length})</option>
                <option value="completed">Sudah Selesai ({completed.length})</option>
              </select>
            </div>
          </div>
        </div>

        <ReminderTable
          rows={filteredReminders}
          whatsapp={whatsapp}
          update={update}
        />
      </div>
    </div>
  );
}
