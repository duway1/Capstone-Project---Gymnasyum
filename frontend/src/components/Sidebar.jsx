import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  History,
  LogOut,
  Dumbbell,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  PlusCircle,
  CalendarPlus,
  UserPlus,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'Overview',
    label: 'Dashboard',
    shortLabel: 'Overview',
    desc: 'Ringkasan data & metrik',
    icon: LayoutDashboard,
    badgeKey: null
  },
  {
    id: 'Members',
    label: 'Data Member',
    shortLabel: 'Member',
    desc: 'Kelola pelanggan gym',
    icon: Users,
    badgeKey: 'members'
  },
  {
    id: 'Schedules',
    label: 'Jadwal Kelas',
    shortLabel: 'Jadwal',
    desc: 'Sesi latihan & presensi',
    icon: Calendar,
    badgeKey: 'schedules'
  },
  {
    id: 'Reminders',
    label: 'Pengingat Harian',
    shortLabel: 'Pengingat',
    desc: 'Follow-up WhatsApp aktif',
    icon: Bell,
    badgeKey: 'reminders',
    isUrgentBadge: true
  },
  {
    id: 'History',
    label: 'Riwayat Log',
    shortLabel: 'Riwayat',
    desc: 'Rekam jejak komunikasi',
    icon: History,
    badgeKey: 'history'
  }
];

export default function Sidebar({
  page,
  setPage,
  user,
  onLogout,
  reminderCount = 0,
  membersCount = 0,
  schedulesCount = 0,
  historyCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  onQuickAction
}) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  const badgeCounts = {
    members: membersCount,
    schedules: schedulesCount,
    reminders: reminderCount,
    history: historyCount
  };

  const handleNavClick = (id) => {
    setPage(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-label="Tutup Menu"
        />
      )}

      <aside
        className={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
          mobileOpen ? 'is-mobile-open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand-container">
          <div className="sidebar-brand-left" onClick={() => handleNavClick('Overview')}>
            <div className="sidebar-brand-icon">
              <Dumbbell size={22} />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <h1>Gymnasyum</h1>
                <span>CRM ADMIN SYSTEM</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="sidebar-toggle-btn desktop-only-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Perluas Menu Sidebar' : 'Ciutkan Menu Sidebar'}
            aria-label={isCollapsed ? 'Perluas Menu Sidebar' : 'Ciutkan Menu Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="sidebar-close-btn mobile-only-btn"
            onClick={onCloseMobile}
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Action Shortcut (Expanded mode) */}
        {!isCollapsed && onQuickAction && (
          <div className="sidebar-quick-bar">
            <span className="sidebar-quick-title">AKSI CEPAT</span>
            <div className="sidebar-quick-buttons">
              <button
                type="button"
                className="btn-sidebar-quick"
                onClick={() => {
                  onQuickAction('add-member');
                  if (onCloseMobile) onCloseMobile();
                }}
                title="Daftarkan pelanggan baru"
              >
                <UserPlus size={14} />
                <span>+ Member</span>
              </button>
              <button
                type="button"
                className="btn-sidebar-quick"
                onClick={() => {
                  onQuickAction('add-schedule');
                  if (onCloseMobile) onCloseMobile();
                }}
                title="Jadwalkan kelas baru"
              >
                <CalendarPlus size={14} />
                <span>+ Jadwal</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="sidebar-menu">
          {!isCollapsed && <div className="menu-group-label">MENU UTAMA</div>}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            const count = item.badgeKey ? badgeCounts[item.badgeKey] : null;

            return (
              <div key={item.id} className="sidebar-nav-item-wrapper">
                <button
                  type="button"
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? `${item.label} (${count ?? 0})` : undefined}
                >
                  <div className="nav-icon-box">
                    <Icon className="nav-icon" size={19} />
                    {isCollapsed && count > 0 && (
                      <span
                        className={`mini-badge-dot ${
                          item.isUrgentBadge ? 'dot-urgent' : ''
                        }`}
                      />
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="nav-content-box">
                      <div className="nav-label-row">
                        <span className="nav-label">{item.label}</span>
                        {count !== null && count > 0 && (
                          <span
                            className={`nav-badge ${
                              item.isUrgentBadge ? 'nav-badge-urgent' : 'nav-badge-neutral'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                      <span className="nav-desc">{item.desc}</span>
                    </div>
                  )}

                  {!isCollapsed && isActive && (
                    <div className="nav-active-pill-indicator">
                      <ChevronRight size={14} />
                    </div>
                  )}
                </button>

                {/* Collapsed floating tooltip */}
                {isCollapsed && (
                  <div className="sidebar-floating-tooltip">
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                    {count !== null && (
                      <small className="tooltip-count">Total: {count}</small>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Card & Logout */}
        {user && (
          <div className="sidebar-bottom-card">
            <div className="user-profile-summary">
              <span className="user-avatar-circle" title={user.name || 'Admin'}>
                {initials}
              </span>

              {!isCollapsed && (
                <div className="user-profile-info">
                  <strong className="user-fullname">{user.name || 'Admin'}</strong>
                  <div className="user-role-row">
                    <span className="user-role-chip">{user.role || 'ADMIN'}</span>
                    <span className="user-status-dot" title="Aktif"></span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={onLogout}
                title="Keluar dari akun"
                aria-label="Keluar dari akun"
              >
                <LogOut size={16} />
                {!isCollapsed && <span>Keluar</span>}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
