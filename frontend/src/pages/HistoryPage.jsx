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
  FileText
} from 'lucide-react';

export default function HistoryPage({ history = [] }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchSearch =
        (h.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.class_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.note || '').toLowerCase().includes(search.toLowerCase());
      const matchAction =
        actionFilter === 'all' || h.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [history, search, actionFilter]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
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

  const getActionBadge = (action) => {
    switch (action) {
      case 'sent':
        return { text: 'Pesan Terkirim', cls: 'status-sent', icon: Send };
      case 'opened':
        return { text: 'Tautan Dibuka', cls: 'status-opened', icon: CheckCircle2 };
      case 'responded':
        return { text: 'Member Merespons', cls: 'status-responded', icon: Check };
      case 'no_response':
        return { text: 'Tanpa Balasan', cls: 'status-no-response', icon: AlertCircle };
      default:
        return { text: action, cls: 'status-default', icon: Clock };
    }
  };

  return (
    <div className="history-page-container">
      {/* History Header Card */}
      <div className="history-header-card">
        <div className="history-icon-circle">
          <History size={24} />
        </div>
        <div>
          <h3>Log & Riwayat Komunikasi Member</h3>
          <p>
            Catatan kronologis setiap kali tautan WhatsApp dibuka, status ditandai terkirim, atau respon dari member dicatat.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Riwayat Aktivitas ({history.length})</h3>
            <p className="controls-subtext">Menampilkan 500 riwayat status terbaru.</p>
          </div>

          <div className="controls-right">
            {/* Search Input */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari member, kelas, atau catatan..."
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
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">Semua Tindakan</option>
                <option value="sent">Pesan Terkirim</option>
                <option value="opened">Tautan Dibuka</option>
                <option value="responded">Merespons</option>
                <option value="no_response">Tanpa Balasan</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Waktu & Tanggal</th>
                <th>Member</th>
                <th>Kelas Gym</th>
                <th>Tindakan / Status</th>
                <th>Catatan Tambahan</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((h) => {
                  const act = getActionBadge(h.action);
                  const ActIcon = act.icon;

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
                      </td>
                      <td>
                        <span className="class-pill-tag">{h.class_name || '-'}</span>
                      </td>
                      <td>
                        <span className={`badge-pill ${act.cls}`}>
                          <ActIcon size={13} />
                          {act.text}
                        </span>
                      </td>
                      <td>
                        <div className="note-cell">
                          {h.note ? (
                            <>
                              <FileText size={13} className="note-icon" />
                              <span className="note-text">{h.note}</span>
                            </>
                          ) : (
                            <span className="note-empty">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state-card">
                      <History size={36} className="empty-icon-subtle" />
                      <h4>Belum Ada Riwayat Aktivitas</h4>
                      <p>
                        {search
                          ? `Tidak ditemukan riwayat yang cocok dengan kata kunci "${search}".`
                          : 'Riwayat interaksi akan otomatis tercatat saat Anda membuka tautan WhatsApp atau mengubah status pengingat.'}
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
