import { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  CheckCircle2,
  XCircle,
  Users,
  Filter,
  X,
  MessageCircle,
  Eye,
  CalendarPlus,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import MemberDetailModal from '../components/MemberDetailModal';

export default function MembersPage({
  members = [],
  form,
  setForm,
  edit,
  setEdit,
  onSave,
  onRemove,
  onAddScheduleForMember
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailMemberId, setDetailMemberId] = useState(null);
  const [formOpen, setFormOpen] = useState(true);

  // If edit is triggered from outside, ensure form is open
  const isFormVisible = formOpen || Boolean(edit);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search) ||
        (m.email && m.email.toLowerCase().includes(search.toLowerCase()));
      const matchStatus =
        statusFilter === 'all' || m.membership_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [members, search, statusFilter]);

  const activeCount = members.filter((m) => m.membership_status === 'active').length;
  const inactiveCount = members.filter((m) => m.membership_status === 'inactive').length;

  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'MB';
  };

  return (
    <div className="members-page-container">
      {/* Top Form: Add / Edit Member with Toggle */}
      <div className={`form-section-card ${edit ? 'editing-mode-card' : ''}`}>
        <div className="form-card-header">
          <div className="form-header-title">
            <div className="header-icon-box">
              <UserPlus size={20} />
            </div>
            <div>
              <h3>{edit ? 'Edit Data Pelanggan' : 'Form Tambah Pelanggan Baru'}</h3>
              <p>
                {edit
                  ? 'Perbarui rincian nama, nomor WhatsApp, email, status, atau catatan preferensi.'
                  : 'Daftarkan pelanggan baru agar siap dijadwalkan ke kelas latihan gym.'}
              </p>
            </div>
          </div>

          <div className="form-header-right-actions">
            {edit ? (
              <button
                type="button"
                className="btn-cancel-edit"
                onClick={() => {
                  setEdit(null);
                  setForm({
                    name: '',
                    phone: '',
                    email: '',
                    membership_status: 'active',
                    notes: ''
                  });
                }}
              >
                <X size={15} /> Batal Edit
              </button>
            ) : (
              <button
                type="button"
                className="btn-toggle-form"
                onClick={() => setFormOpen(!formOpen)}
                title={formOpen ? 'Ciutkan Form' : 'Buka Form Input'}
              >
                {formOpen ? (
                  <>
                    <ChevronUp size={16} />
                    <span>Ciutkan Form</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>+ Buka Form Tambah</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {isFormVisible && (
          <form onSubmit={onSave} className="member-input-form">
            <div className="form-grid-4">
              <div className="form-input-wrapper">
                <label htmlFor="member-name">Nama Lengkap Pelanggan</label>
                <input
                  id="member-name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-input-wrapper">
                <label htmlFor="member-phone">Nomor WhatsApp Aktif</label>
                <input
                  id="member-phone"
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <small className="field-hint">Digunakan untuk pengiriman notifikasi pesan draf WhatsApp.</small>
              </div>

              <div className="form-input-wrapper">
                <label htmlFor="member-email">Alamat Email (Opsional)</label>
                <input
                  id="member-email"
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-input-wrapper">
                <label htmlFor="member-status">Status Keanggotaan</label>
                <select
                  id="member-status"
                  value={form.membership_status || 'active'}
                  onChange={(e) =>
                    setForm({ ...form, membership_status: e.target.value })
                  }
                >
                  <option value="active">🟢 Aktif (Active)</option>
                  <option value="inactive">⚪ Tidak Aktif (Inactive)</option>
                </select>
              </div>
            </div>

            <div className="form-input-wrapper full-width-field">
              <label htmlFor="member-notes">
                Catatan Tambahan & Preferensi Latihan (Opsional)
              </label>
              <input
                id="member-notes"
                type="text"
                placeholder="Contoh: Fokus strength training, preferensi sesi sore hari, riwayat cedera lutut..."
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="form-actions-bar">
              <button type="submit" className="btn-primary-action">
                <UserPlus size={16} />
                <span>{edit ? 'Simpan Perubahan Pelanggan' : 'Simpan Data Pelanggan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Directory Section: Search, Filter Tabs & Table */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Direktori Pelanggan ({filteredMembers.length})</h3>
            <p className="controls-subtext">
              Klik nama member untuk melihat profil lengkap, riwayat kehadiran, dan grafik statistik.
            </p>
          </div>

          <div className="controls-right">
            {/* Search Input */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari nama, WhatsApp, atau email..."
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

            {/* Quick Status Filter Tabs */}
            <div className="quick-filter-pills-row">
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Semua ({members.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-done ${statusFilter === 'active' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Aktif ({activeCount})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'inactive' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('inactive')}
              >
                Nonaktif ({inactiveCount})
              </button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Pelanggan Member</th>
                <th>Kontak & WhatsApp</th>
                <th>Status Keanggotaan</th>
                <th>Catatan Khusus</th>
                <th className="text-right">Aksi Menu</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const isActive = m.membership_status === 'active';
                  const waNumber = m.phone.replace(/\D/g, '').replace(/^0/, '62');

                  return (
                    <tr key={m.id} className="table-row-hover">
                      <td>
                        <div
                          className="member-avatar-cell clickable-member"
                          onClick={() => setDetailMemberId(m.id)}
                          title="Klik untuk melihat profil, statistik & histori lengkap"
                        >
                          <span
                            className={`member-avatar ${
                              isActive ? 'avatar-active' : 'avatar-inactive'
                            }`}
                          >
                            {getInitials(m.name)}
                          </span>
                          <div>
                            <strong className="member-fullname">{m.name}</strong>
                            <small className="member-id-tag">ID: #{m.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="phone-cell">
                          <span className="phone-text">{m.phone}</span>
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-phone-wa"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </div>
                        {m.email && (
                          <small className="member-email-hint">{m.email}</small>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge-pill ${
                            isActive ? 'status-active' : 'status-inactive'
                          }`}
                        >
                          <span className="badge-dot"></span>
                          {isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>
                        <span className="table-notes-preview" title={m.notes || ''}>
                          {m.notes || '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="actions-cluster">
                          {/* Quick Add Schedule for Member */}
                          {onAddScheduleForMember && (
                            <button
                              type="button"
                              className="btn-table-action btn-action-schedule"
                              onClick={() => onAddScheduleForMember(m)}
                              title="Jadwalkan kelas untuk pelanggan ini"
                            >
                              <CalendarPlus size={14} />
                              <span>+ Jadwal</span>
                            </button>
                          )}

                          {/* View Details Button */}
                          <button
                            type="button"
                            className="btn-table-action btn-action-view"
                            onClick={() => setDetailMemberId(m.id)}
                            title="Lihat profil, statistik kehadiran & riwayat"
                          >
                            <Eye size={14} />
                            <span>Detail</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            className="btn-table-action btn-action-edit"
                            onClick={() => {
                              setEdit(m.id);
                              setForm({
                                name: m.name,
                                phone: m.phone,
                                email: m.email || '',
                                membership_status: m.membership_status,
                                notes: m.notes || ''
                              });
                              setFormOpen(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Edit data pelanggan"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn-table-action btn-action-delete"
                            onClick={() => onRemove(m.id)}
                            title="Hapus pelanggan ini beserta jadwal terkait"
                          >
                            <Trash2 size={14} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state-card">
                      <Users size={38} className="empty-icon-subtle" />
                      <h4>Tidak Ada Pelanggan Ditemukan</h4>
                      <p>
                        {search
                          ? `Tidak ditemukan member yang cocok dengan kata kunci "${search}".`
                          : 'Belum ada data pelanggan yang sesuai filter ini.'}
                      </p>
                      {search && (
                        <button
                          type="button"
                          className="btn-empty-reset"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                          }}
                        >
                          Reset Pencarian & Filter
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

      {/* Member Profile & Statistics Modal */}
      <MemberDetailModal
        isOpen={Boolean(detailMemberId)}
        onClose={() => setDetailMemberId(null)}
        memberId={detailMemberId}
        onAddScheduleForMember={onAddScheduleForMember}
      />
    </div>
  );
}
