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
  Sparkles
} from 'lucide-react';
import StatusModal from './StatusModal';

export default function ReminderTable({ rows = [], whatsapp, update }) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [modalData, setModalData] = useState({
    isOpen: false,
    reminder: null,
    initialStatus: 'sent'
  });

  // Menutup dropdown jika user mengklik area lain
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return { text: 'Tinggi (Sering Absen)', cls: 'priority-high' };
      case 'medium':
        return { text: 'Sedang', cls: 'priority-medium' };
      default:
        return { text: 'Normal', cls: 'priority-low' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return { text: 'Terjadwal', cls: 'status-scheduled', icon: Clock };
      case 'opened':
        return { text: 'Link Dibuka', cls: 'status-opened', icon: CheckCircle2 };
      case 'sent':
        return { text: 'Sudah Dikirim', cls: 'status-sent', icon: Send };
      case 'responded':
        return { text: 'Merespons', cls: 'status-responded', icon: Check };
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
        <p>Tidak ada pengingat kelas yang perlu dikirim hari ini.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive-wrapper">
        <table className="modern-data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Kelas Gym</th>
              <th>Prioritas Follow-up</th>
              <th>Status Pengingat</th>
              <th className="text-right">Aksi Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const prio = getPriorityLabel(r.priority);
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
                      <strong className="class-title">{r.class_name}</strong>
                      {r.starts_at && (
                        <span className="class-time">
                          <Clock size={12} /> {formatTime(r.starts_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-pill ${prio.cls}`}>
                      <span className="badge-dot"></span>
                      {prio.text}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${stat.cls} clickable-status-pill`}
                      onClick={() => openStatusModal(r, r.status === 'scheduled' ? 'sent' : r.status)}
                      title="Klik untuk memperbarui status pengingat"
                    >
                      <StatusIcon size={13} />
                      {stat.text}
                    </span>
                  </td>
                  <td className="text-right">
                    <div
                      className="actions-cluster-clean"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* WhatsApp Button (Clean & Prominent) */}
                      <button
                        className="btn-action-wa"
                        onClick={() => whatsapp(r)}
                        title="Buka draf pesan otomatis di WhatsApp Web"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </button>

                      {/* Dropdown Action Menu (Replaces crowded 3 buttons) */}
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
                          <span>Update Status</span>
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
