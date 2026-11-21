import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  X,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Check,
  FileText,
  PlusCircle,
  Phone,
  MessageCircle,
  Users,
  Instagram,
  Tag,
  RotateCcw
} from 'lucide-react';
import ManualLogModal from '../components/ManualLogModal';

export default function HistoryPage({ history = [], members = [], onLogAdded }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchSearch =
        (h.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.class_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.note || '').toLowerCase().includes(search.toLowerCase());

      const matchAction =
        actionFilter === 'all' || h.action === actionFilter;

      const matchChannel =
        channelFilter === 'all' || (h.channel || 'whatsapp') === channelFilter;

      const matchMember =
        selectedMemberId === 'all' ||
        String(h.member_id) === String(selectedMemberId);

      return matchSearch && matchAction && matchChannel && matchMember;
    });
  }, [history, search, actionFilter, channelFilter, selectedMemberId]);

  const hasActiveFilters =
    Boolean(search) ||
    actionFilter !== 'all' ||
    channelFilter !== 'all' ||
    selectedMemberId !== 'all';

  const resetAllFilters = () => {
    setSearch('');
    setActionFilter('all');
    setChannelFilter('all');
    setSelectedMemberId('all');
  };

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

  const getActionBadge = (action) => {
    switch (action) {
      case 'sent':
      case 'Pesan Terkirim':
        return { text: 'Pesan Terkirim', cls: 'status-sent', icon: Send };
      case 'opened':
      case 'Tautan Dibuka':
        return { text: 'Tautan Dibuka', cls: 'status-opened', icon: CheckCircle2 };
      case 'responded':
      case 'Konfirmasi Hadir':
      case 'Member Merespons':
        return { text: 'Member Merespons', cls: 'status-responded', icon: Check };
      case 'no_response':
      case 'Tanpa Balasan':
        return { text: 'Tanpa Balasan', cls: 'status-no-response', icon: AlertCircle };
      case 'Minta Reschedule':
        return { text: 'Minta Reschedule', cls: 'status-reschedule', icon: Clock };
      case 'Izin Berhalangan':
        return { text: 'Izin Absen', cls: 'status-absent-log', icon: AlertCircle };
      default:
        return { text: action, cls: 'status-default', icon: Tag };
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'phone':
        return { icon: Phone, text: 'Telepon', cls: 'channel-phone' };
      case 'in_person':
        return { icon: Users, text: 'Tatap Muka', cls: 'channel-person' };
      case 'instagram':
        return { icon: Instagram, text: 'Instagram', cls: 'channel-ig' };
      default:
        return { icon: MessageCircle, text: 'WhatsApp', cls: 'channel-wa' };
    }
  };

  // Metrics
  const totalLogs = history.length;
  const waLogs = history.filter((h) => !h.channel || h.channel === 'whatsapp').length;
  const responseLogs = history.filter(
    (h) =>
      h.action === 'responded' ||
      h.action === 'Konfirmasi Hadir' ||
      h.action === 'Member Merespons'
  ).length;
  const callLogs = history.filter(
    (h) => h.channel === 'phone' || h.channel === 'in_person'
  ).length;

  return (
    <div className="history-page-container">
      {/* History Header Card */}
      <div className="history-header-card">
        <div className="history-left-info">
          <div className="history-icon-circle">
            <History size={24} />
          </div>
          <div>
            <h3>Rekam Jejak & Riwayat Interaksi Pelanggan</h3>
            <p>
              Mencatat seluruh rekam jejak pengiriman pesan WhatsApp, riwayat panggilan telepon, konfirmasi kehadiran,
              maupun permintaan reschedule secara transparan.
            </p>
          </div>
        </div>

        {/* Action Button: Manual Log */}
        <button
          type="button"
          className="btn-primary-action btn-add-log"
          onClick={() => setIsManualModalOpen(true)}
          title="Catat panggilan telepon, tatap muka, atau chat baru"
        >
          <PlusCircle size={16} />
          <span>+ Catat Komunikasi Baru</span>
        </button>
      </div>

      {/* Metric Counters Grid (Interactive Filter Quick Picks) */}
      <div className="history-metrics-grid">
        <div
          className={`metric-counter-card ${channelFilter === 'all' && actionFilter === 'all' ? 'active-metric' : ''}`}
          onClick={resetAllFilters}
          role="button"
          tabIndex={0}
          title="Tampilkan semua rekam jejak"
        >
          <div className="metric-header">
            <History size={18} className="metric-icon-blue" />
            <span>Total Catatan Interaksi</span>
          </div>
          <strong className="metric-number">{totalLogs}</strong>
          <small>Semua riwayat terdata</small>
        </div>

        <div
          className={`metric-counter-card ${channelFilter === 'whatsapp' ? 'active-metric' : ''}`}
          onClick={() => {
            setChannelFilter(channelFilter === 'whatsapp' ? 'all' : 'whatsapp');
          }}
          role="button"
          tabIndex={0}
          title="Filter hanya catatan WhatsApp"
        >
          <div className="metric-header">
            <MessageCircle size={18} className="metric-icon-emerald" />
            <span>Pesan WhatsApp</span>
          </div>
          <strong className="metric-number text-emerald">{waLogs}</strong>
          <small>Pengingat & follow-up WA</small>
        </div>

        <div
          className={`metric-counter-card ${actionFilter === 'responded' ? 'active-metric' : ''}`}
          onClick={() => {
            setActionFilter(actionFilter === 'responded' ? 'all' : 'responded');
          }}
          role="button"
          tabIndex={0}
          title="Filter hanya catatan respon masuk"
        >
          <div className="metric-header">
            <CheckCircle2 size={18} className="metric-icon-blue" />
            <span>Respon / Konfirmasi</span>
          </div>
          <strong className="metric-number text-primary">{responseLogs}</strong>
          <small>Pelanggan membalas kabar</small>
        </div>

        <div
          className={`metric-counter-card ${channelFilter === 'phone' ? 'active-metric' : ''}`}
          onClick={() => {
            setChannelFilter(channelFilter === 'phone' ? 'all' : 'phone');
          }}
          role="button"
          tabIndex={0}
          title="Filter panggilan telepon atau tatap muka"
        >
          <div className="metric-header">
            <Phone size={18} className="metric-icon-amber" />
            <span>Panggilan / Tatap Muka</span>
          </div>
          <strong className="metric-number text-amber">{callLogs}</strong>
          <small>Kontak via resepsionis / telepon</small>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Riwayat Komunikasi ({filteredHistory.length})</h3>
            <p className="controls-subtext">
              Gunakan filter saluran, nama pelanggan, atau ketik kata kunci untuk menemukan catatan.
            </p>
          </div>

          <div className="controls-right history-filters-cluster">
            {/* Search Input */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari nama, kelas, atau isi pesan..."
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

            {/* Filter by Channel Pills */}
            <div className="quick-filter-pills-row">
              <button
                type="button"
                className={`filter-pill-btn ${channelFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setChannelFilter('all')}
              >
                Semua Saluran
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-done ${channelFilter === 'whatsapp' ? 'is-active' : ''}`}
                onClick={() => setChannelFilter('whatsapp')}
              >
                WhatsApp
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${channelFilter === 'phone' ? 'is-active' : ''}`}
                onClick={() => setChannelFilter('phone')}
              >
                Telepon
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${channelFilter === 'in_person' ? 'is-active' : ''}`}
                onClick={() => setChannelFilter('in_person')}
              >
                Tatap Muka
              </button>
            </div>

            {/* Filter by Specific Member */}
            <div className="filter-dropdown-wrapper">
              <Users size={14} className="filter-icon" />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                title="Filter berdasarkan member tertentu"
              >
                <option value="all">Semua Pelanggan Member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Action */}
            <div className="filter-dropdown-wrapper">
              <Filter size={14} className="filter-icon" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                title="Filter kategori respon / status"
              >
                <option value="all">Semua Kategori Status</option>
                <option value="sent">Pesan Terkirim</option>
                <option value="opened">Tautan Dibuka</option>
                <option value="responded">Merespons</option>
                <option value="no_response">Tanpa Balasan</option>
                <option value="Konfirmasi Hadir">Konfirmasi Hadir</option>
                <option value="Minta Reschedule">Minta Reschedule</option>
                <option value="Izin Berhalangan">Izin Berhalangan</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={resetAllFilters}
                title="Kembalikan semua filter ke awal"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Waktu & Tanggal</th>
                <th>Pelanggan Member</th>
                <th>Saluran Komunikasi</th>
                <th>Kelas Terkait</th>
                <th>Tindakan / Status</th>
                <th>Isi Catatan / Respon Pelanggan</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((h) => {
                  const act = getActionBadge(h.action);
                  const ActIcon = act.icon;
                  const ch = getChannelIcon(h.channel);
                  const ChIcon = ch.icon;

                  return (
                    <tr key={h.id} className="table-row-hover">
                      <td>
                        <div className="time-cell">
                          <Clock size={13} className="cell-icon" />
                          <span>{formatDateTime(h.created_at)}</span>
                        </div>
                      </td>
                      <td>
                        <strong className="member-name">{h.name || '-'}</strong>
                        {h.phone && (
                          <small className="member-phone-sub">{h.phone}</small>
                        )}
                      </td>
                      <td>
                        <span className={`channel-pill ${ch.cls}`}>
                          <ChIcon size={12} /> {ch.text}
                        </span>
                      </td>
                      <td>
                        {h.class_name ? (
                          <span className="class-pill-tag">{h.class_name}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge-pill ${act.cls}`}>
                          <ActIcon size={12} /> {act.text}
                        </span>
                      </td>
                      <td>
                        <div className="note-text-cell" title={h.note || ''}>
                          {h.note || '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state-card">
                      <History size={38} className="empty-icon-subtle" />
                      <h4>Tidak Ada Catatan Komunikasi Ditemukan</h4>
                      <p>
                        {hasActiveFilters
                          ? 'Tidak ada riwayat interaksi yang cocok dengan filter yang Anda tentukan.'
                          : 'Belum ada rekam jejak komunikasi yang tersimpan.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="btn-empty-reset"
                          onClick={resetAllFilters}
                        >
                          Reset Semua Filter
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

      {/* Manual Communication Log Modal */}
      <ManualLogModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        members={members}
        onLogAdded={() => {
          if (onLogAdded) onLogAdded();
        }}
      />
    </div>
  );
}
