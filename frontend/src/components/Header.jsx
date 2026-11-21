import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  LogOut,
  Calendar as CalendarIcon,
  CheckCircle2,
  Menu,
  Plus,
  ChevronDown,
  UserPlus,
  CalendarPlus,
  MessageSquare,
  History,
  Shield,
  HelpCircle,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Database
} from 'lucide-react';

const PAGE_META = {
  Overview: {
    title: 'Dashboard Overview',
    desc: 'Ringkasan statistik pelanggan, jadwal latihan, dan pengingat aktif hari ini.',
    iconName: 'LayoutDashboard'
  },
  Members: {
    title: 'Manajemen Data Pelanggan',
    desc: 'Kelola data pelanggan gym & private coaching, status keanggotaan, dan kontak WhatsApp.',
    iconName: 'Users'
  },
  Schedules: {
    title: 'Jadwal Kelas & Private Coaching',
    desc: 'Atur sesi group class, private coaching, instruktur/coach, dan presensi kehadiran pelanggan.',
    iconName: 'Calendar'
  },
  Reminders: {
    title: 'Dashboard Pengingat Harian',
    desc: 'Kirim notifikasi draf WhatsApp otomatis (wa.me) dan lacak alur konfirmasi secara end-to-end.',
    iconName: 'Bell'
  },
  History: {
    title: 'Riwayat Log Komunikasi',
    desc: 'Catatan seluruh riwayat perubahan status follow-up dan interaksi pelanggan.',
    iconName: 'History'
  }
};

export default function Header({
  page,
  setPage,
  user,
  onLogout,
  onRefresh,
  loading = false,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onOpenMobileMenu,
  onQuickAction
}) {
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const quickMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const meta = PAGE_META[page] || {
    title: page,
    desc: 'Kelola operasional gym dan CRM dalam satu dashboard.'
  };

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const initials = user?.name
    ? user.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'AD';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target)) {
        setQuickMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="app-top-header">
      {/* Left side: Hamburger (mobile), Sidebar collapse toggle, Breadcrumb & Title */}
      <div className="header-left-cluster">
        <button
          type="button"
          className="header-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          title="Buka Navigasi Menu"
          aria-label="Buka Navigasi Menu"
        >
          <Menu size={22} />
        </button>

        {onToggleSidebarCollapse && (
          <button
            type="button"
            className="header-icon-btn desktop-collapse-btn"
            onClick={onToggleSidebarCollapse}
            title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        )}

        <div className="header-titles">
          <div className="header-breadcrumbs">
            <span
              className="breadcrumb-root clickable-breadcrumb"
              onClick={() => setPage && setPage('Overview')}
              title="Ke Dashboard Overview"
            >
              GYMNASYUM
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{page.toUpperCase()}</span>
          </div>
          <h2>{meta.title}</h2>
          <p>{meta.desc}</p>
        </div>
      </div>

      {/* Right side: Action Menus, Date, Refresh & User */}
      <div className="header-actions-panel">
        {/* Quick Add / Aksi Cepat Dropdown Menu */}
        {onQuickAction && (
          <div className="header-dropdown-wrapper" ref={quickMenuRef}>
            <button
              type="button"
              className={`btn-header-quick-action ${quickMenuOpen ? 'is-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setQuickMenuOpen(!quickMenuOpen);
                setUserDropdownOpen(false);
              }}
              title="Menu Aksi Cepat"
            >
              <Plus size={16} className="quick-plus-icon" />
              <span>Aksi Cepat</span>
              <ChevronDown
                size={14}
                className={`quick-chevron ${quickMenuOpen ? 'is-rotated' : ''}`}
              />
            </button>

            {quickMenuOpen && (
              <div className="header-dropdown-menu quick-actions-dropdown">
                <div className="dropdown-menu-header">
                  <strong>PILIHAN AKSI CEPAT</strong>
                  <small>Buat data atau kirim pesan langsung</small>
                </div>

                <button
                  type="button"
                  className="dropdown-menu-row"
                  onClick={() => {
                    onQuickAction('add-member');
                    setQuickMenuOpen(false);
                  }}
                >
                  <div className="row-icon-box box-purple">
                    <UserPlus size={15} />
                  </div>
                  <div className="row-text-box">
                    <strong>Tambah Pelanggan Baru</strong>
                    <small>Daftarkan profil & nomor WhatsApp</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="dropdown-menu-row"
                  onClick={() => {
                    onQuickAction('add-schedule');
                    setQuickMenuOpen(false);
                  }}
                >
                  <div className="row-icon-box box-blue">
                    <CalendarPlus size={15} />
                  </div>
                  <div className="row-text-box">
                    <strong>Buat Jadwal Kelas / Coaching</strong>
                    <small>Sesi latihan & jadwal pengingat</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="dropdown-menu-row"
                  onClick={() => {
                    onQuickAction('log-communication');
                    setQuickMenuOpen(false);
                  }}
                >
                  <div className="row-icon-box box-amber">
                    <History size={15} />
                  </div>
                  <div className="row-text-box">
                    <strong>Catat Log Komunikasi</strong>
                    <small>Telepon, tatap muka, atau chat WA</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="dropdown-menu-row"
                  onClick={() => {
                    onQuickAction('view-reminders');
                    setQuickMenuOpen(false);
                  }}
                >
                  <div className="row-icon-box box-rose">
                    <Bell size={15} />
                  </div>
                  <div className="row-text-box">
                    <strong>Pengingat Hari Ini</strong>
                    <small>Daftar pesan WA siap dikirim</small>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Date chip */}
        <div className="header-chip date-chip">
          <CalendarIcon size={14} />
          <span>{currentDate}</span>
        </div>

        {/* Server status chip with pulse */}
        <div className="header-chip status-chip" title="Status koneksi API backend aktif">
          <span className="live-status-dot"></span>
          <span>Online</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            className={`header-icon-btn refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={onRefresh}
            title="Segarkan Data Seluruh Menu"
            aria-label="Segarkan Data"
          >
            <RefreshCw size={16} />
          </button>
        )}

        {/* User profile dropdown menu */}
        <div className="header-dropdown-wrapper" ref={userMenuRef}>
          <div
            className="header-user-badge interactive-user-badge"
            onClick={(e) => {
              e.stopPropagation();
              setUserDropdownOpen(!userDropdownOpen);
              setQuickMenuOpen(false);
            }}
            role="button"
            tabIndex={0}
            title="Menu Akun Administrator"
          >
            <span className="user-initials-badge">{initials}</span>
            <div className="user-name-box">
              <strong>{user?.name || 'Administrator'}</strong>
              <small>@{user?.username || 'admin'}</small>
            </div>
            <ChevronDown
              size={13}
              className={`user-chevron ${userDropdownOpen ? 'is-rotated' : ''}`}
            />
          </div>

          {userDropdownOpen && (
            <div className="header-dropdown-menu user-profile-dropdown">
              <div className="user-dropdown-header">
                <span className="user-avatar-large">{initials}</span>
                <div>
                  <strong>{user?.name || 'Administrator'}</strong>
                  <div className="user-role-badge-row">
                    <span className="user-role-pill">{user?.role || 'ADMIN'}</span>
                    <small className="user-id-sub">ID: #{user?.id || 1}</small>
                  </div>
                </div>
              </div>

              <div className="user-dropdown-divider" />

              <div className="user-dropdown-meta-item">
                <Shield size={14} className="meta-icon" />
                <span>Hak Akses: Administrator Full-Stack</span>
              </div>

              <div className="user-dropdown-divider" />

              {onLogout && (
                <button
                  type="button"
                  className="dropdown-menu-logout-btn"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
