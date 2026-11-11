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
  MessageCircle
} from 'lucide-react';

export default function MembersPage({
  members = [],
  form,
  setForm,
  edit,
  setEdit,
  onSave,
  onRemove
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search);
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
      {/* Top Form: Add / Edit Member */}
      <div className={`form-section-card ${edit ? 'editing-mode-card' : ''}`}>
        <div className="form-card-header">
          <div className="form-header-title">
            <div className="header-icon-box">
              <UserPlus size={20} />
            </div>
            <div>
              <h3>{edit ? 'Edit Data Member' : 'Tambah Member Baru'}</h3>
              <p>
                {edit
                  ? 'Perbarui rincian nama, nomor telepon, atau status member.'
                  : 'Daftarkan member baru agar dapat dijadwalkan ke kelas gym.'}
              </p>
            </div>
          </div>
          {edit && (
            <button
              type="button"
              className="btn-cancel-edit"
              onClick={() => {
                setEdit(null);
                setForm({ name: '', phone: '', membership_status: 'active' });
              }}
            >
              <X size={15} /> Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={onSave} className="member-input-form">
          <div className="form-grid-3">
            <div className="form-input-wrapper">
              <label htmlFor="member-name">Nama Lengkap Member</label>
              <input
                id="member-name"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-input-wrapper">
              <label htmlFor="member-phone">Nomor Telepon / WhatsApp</label>
              <input
                id="member-phone"
                type="text"
                placeholder="Contoh: 08123456789 atau +628123456789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <small className="field-hint">Pastikan nomor aktif untuk pengiriman pesan pengingat.</small>
            </div>

            <div className="form-input-wrapper">
              <label htmlFor="member-status">Status Keanggotaan</label>
              <select
                id="member-status"
                value={form.membership_status}
                onChange={(e) =>
                  setForm({ ...form, membership_status: e.target.value })
                }
              >
                <option value="active">Aktif (Active)</option>
                <option value="inactive">Tidak Aktif (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="form-actions-bar">
            <button type="submit" className="btn-primary-action">
              <UserPlus size={16} />
              <span>{edit ? 'Simpan Perubahan Member' : 'Tambah Member'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Directory Section: Search, Filters & Table */}
      <div className="dashboard-section-card">
        <div className="directory-header-controls">
          <div className="controls-left">
            <h3>Daftar Direktori Member ({members.length})</h3>
            <div className="status-counter-pills">
              <span className="counter-pill-active">
                <CheckCircle2 size={13} /> {activeCount} Aktif
              </span>
              <span className="counter-pill-inactive">
                <XCircle size={13} /> {inactiveCount} Nonaktif
              </span>
            </div>
          </div>

          <div className="controls-right">
            {/* Search Input */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari nama atau nomor HP..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="active">Hanya Aktif</option>
                <option value="inactive">Hanya Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Nomor WhatsApp</th>
                <th>Status Keanggotaan</th>
                <th className="text-right">Aksi</th>
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
                        <div className="member-avatar-cell">
                          <span className={`member-avatar ${isActive ? 'avatar-active' : 'avatar-inactive'}`}>
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
                            title="Chat via WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-pill ${isActive ? 'status-active' : 'status-inactive'}`}>
                          <span className="badge-dot"></span>
                          {isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="actions-cluster">
                          <button
                            className="btn-table-action btn-action-edit"
                            onClick={() => {
                              setEdit(m.id);
                              setForm({
                                name: m.name,
                                phone: m.phone,
                                membership_status: m.membership_status
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Edit data member"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="btn-table-action btn-action-delete"
                            onClick={() => onRemove(m.id)}
                            title="Hapus member ini"
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
                  <td colSpan="4">
                    <div className="empty-state-card">
                      <Users size={36} className="empty-icon-subtle" />
                      <h4>Tidak Ada Member Ditemukan</h4>
                      <p>
                        {search
                          ? `Tidak ditemukan member yang cocok dengan kata kunci "${search}".`
                          : 'Belum ada member yang terdaftar. Tambahkan member pertama Anda di atas.'}
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
