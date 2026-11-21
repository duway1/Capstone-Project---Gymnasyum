import { useState, useEffect } from 'react';
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Check,
  Phone,
  ChevronDown,
  Sparkles,
  Eye,
  Info
} from 'lucide-react';
import StatusModal from './StatusModal';

export default function ReminderTable({
  rows = [],
  whatsapp,
  update,
  onOpenTimeline,
  onOpenMessageDrafter
}) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [modalData, setModalData] = useState({
    isOpen: false,
    reminder: null,
    initialStatus: 'sent'
  });

  useEffect(() => {
    const handleDocumentClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return (
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(date) + ' WIB'
      );
    } catch {
      return '-';
    }
  };

  const getPriorityLabel = (r) => {
    switch (r.priority) {
      case 'high':
        return { text: 'Tinggi (High)', cls: 'priority-high', sub: r.priority_reason || 'Absen >=2x dalam 14 hari' };
      case 'medium':
        return { text: 'Sedang (Medium)', cls: 'priority-medium', sub: r.priority_reason || 'Absen 1x / Tanpa balasan' };
      default:
        return { text: 'Normal (Low)', cls: 'priority-low', sub: r.priority_reason || 'Kehadiran teratur' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return { text: 'Terjadwal', cls: 'status-scheduled', icon: Clock };
      case 'sent':
      case 'opened':
        return { text: 'Pesan Terkirim', cls: 'status-sent', icon: Send };
      case 'responded':
        return { text: 'Merespons Hadir', cls: 'status-responded', icon: Check };
      case 'no_response':
        return { text: 'Tanpa Balasan', cls: 'status-no-response', icon: AlertCircle };
      default:
        return { text: status, cls: 'status-default', icon: Clock };
    }
  };

  const openStatusModal = (reminder, status) => {
    setActiveDropdownId(null);
    setModalData({
      isOpen: true,
      reminder,
      initialStatus: status
    });
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">
          <CheckCircle2 size={38} />
        </div>
        <h4>Semua Beres!</h4>
        <p>Tidak ada pengingat kelas yang perlu dikirim pada tanggal ini.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive-wrapper">
        <table className="modern-data-table">
          <thead>
            <tr>
              <th>Member Pelanggan</th>
              <th>Kelas & Tipe Sesi</th>
              <th>Klasifikasi Prioritas</th>
              <th>Status Alur Pengingat</th>
              <th className="text-right">Aksi Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const prio = getPriorityLabel(r);
              const stat = getStatusBadge(r.status);
              const StatusIcon = stat.icon;

              return (
                <tr key={r.id} className="table-row-hover">
                  <td>
                    <div className="member-cell">
                      <strong className="member-name">{r.name}</strong>
                      <span className="member-phone">
                        <Phone size={12} /> {r.phone}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="class-cell">
                      <div className="class-title-row">
                        <strong className="class-title">{r.class_name}</strong>
                        {r.session_type && (
                          <span className="badge-pill badge-session-type-sm">
                            {r.session_type}
                          </span>
                        )}
                      </div>
                      {r.starts_at && (
                        <span className="class-time">
                          <Clock size={12} /> {formatTime(r.starts_at)}
                          {r.instructor_name ? ` • ${r.instructor_name}` : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="priority-table-cell">
                      <span className={`badge-pill ${prio.cls}`}>
                        <span className="badge-dot"></span>
                        {prio.text}
                      </span>
                      <small className="priority-cell-reason" title={prio.sub}>
                        <Info size={11} /> {prio.sub}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${stat.cls} clickable-status-pill`}
                      onClick={() => openStatusModal(r, r.status === 'scheduled' ? 'sent' : r.status)}
                      title="Klik untuk memperbarui status alur pengingat"
                    >
                      <StatusIcon size={13} />
                      {stat.text}
                    </span>
                    {r.note && (
                      <div className="table-note-snippet" title={r.note}>
                        &ldquo;{r.note}&rdquo;
                      </div>
                    )}
                  </td>
                  <td className="text-right">
                    <div
                      className="actions-cluster-clean"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* WhatsApp / Follow-Up Message Button */}
                      <button
                        className="btn-action-wa"
                        onClick={() => {
                          if (onOpenMessageDrafter) {
                            onOpenMessageDrafter(r.id);
                          } else if (whatsapp) {
                            whatsapp(r);
                          }
                        }}
                        title="Buka template pesan follow up otomatis & kirim WA"
                      >
                        <MessageCircle size={15} />
                        <span>Kirim WA</span>
                      </button>

                      {/* Lacak Alur End-to-End Button */}
                      {onOpenTimeline && (
                        <button
                          className="btn-table-action btn-action-track"
                          onClick={() => onOpenTimeline(r.id)}
                          title="Lacak jejak alur status end-to-end"
                        >
                          <Eye size={14} />
                          <span>Lacak</span>
                        </button>
                      )}

                      {/* Dropdown Action Menu */}
                      <div className="action-dropdown-container">
                        <button
                          className={`btn-action-dropdown-trigger ${
                            activeDropdownId === r.id ? 'is-active' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(
                              activeDropdownId === r.id ? null : r.id
                            );
                          }}
                          title="Ubah status pengingat"
                        >
                          <Sparkles size={13} className="trigger-icon" />
                          <span>Status</span>
                          <ChevronDown
                            size={14}
                            className={`chevron-icon ${
                              activeDropdownId === r.id ? 'is-rotated' : ''
                            }`}
                          />
                        </button>

                        {activeDropdownId === r.id && (
                          <div className="action-floating-dropdown-menu">
                            <button
                              className="dropdown-menu-item item-sent"
                              onClick={() => openStatusModal(r, 'sent')}
                            >
                              <div className="dropdown-item-icon-box box-sent">
                                <Send size={14} />
                              </div>
                              <div className="item-text">
                                <strong>Tandai Terkirim</strong>
                                <small>Pesan WA sudah dikirim</small>
                              </div>
                            </button>

                            <button
                              className="dropdown-menu-item item-responded"
                              onClick={() => openStatusModal(r, 'responded')}
                            >
                              <div className="dropdown-item-icon-box box-responded">
                                <CheckCircle2 size={14} />
                              </div>
                              <div className="item-text">
                                <strong>Member Merespons</strong>
                                <small>Konfirmasi hadir / kabar</small>
                              </div>
                            </button>

                            <button
                              className="dropdown-menu-item item-no-response"
                              onClick={() => openStatusModal(r, 'no_response')}
                            >
                              <div className="dropdown-item-icon-box box-no-response">
                                <AlertCircle size={14} />
                              </div>
                              <div className="item-text">
                                <strong>Tanpa Balasan</strong>
                                <small>Belum ada respons member</small>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User-Friendly Custom Modal Popup */}
      <StatusModal
        isOpen={modalData.isOpen}
        onClose={() =>
          setModalData({ isOpen: false, reminder: null, initialStatus: 'sent' })
        }
        reminder={modalData.reminder}
        initialStatus={modalData.initialStatus}
        onSave={update}
      />
    </>
  );
}
