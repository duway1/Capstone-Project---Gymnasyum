import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  History,
  LogOut,
  Dumbbell
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'Overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'Members', label: 'Data Member', icon: Users },
  { id: 'Schedules', label: 'Jadwal Kelas', icon: Calendar },
  { id: 'Reminders', label: 'Pengingat Hari Ini', icon: Bell },
  { id: 'History', label: 'Riwayat Log', icon: History }
];

export default function Sidebar({ page, setPage, user, onLogout, reminderCount = 0 }) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-container">
        <div className="sidebar-brand-icon">
          <Dumbbell size={22} />
        </div>
        <div className="sidebar-brand-text">
          <h1>Gymnasyum</h1>
          <span>CRM ADMIN SYSTEM</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-menu">
        <div className="menu-group-label">MENU UTAMA</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon className="nav-icon" size={19} />
              <span className="nav-label">{item.label}</span>
              {item.id === 'Reminders' && reminderCount > 0 && (
                <span className="nav-badge">{reminderCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card & Logout */}
      {user && (
        <div className="sidebar-bottom-card">
          <div className="user-profile-summary">
            <span className="user-avatar-circle">{initials}</span>
            <div className="user-profile-info">
              <strong className="user-fullname">{user.name || 'Admin'}</strong>
              <span className="user-role-chip">{user.role || 'ADMIN'}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={onLogout} title="Keluar dari akun">
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </aside>
  );
}
