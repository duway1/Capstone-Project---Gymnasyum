import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  History
} from 'lucide-react';

const BOTTOM_ITEMS = [
  { id: 'Overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Members', label: 'Member', icon: Users },
  { id: 'Schedules', label: 'Jadwal', icon: Calendar },
  { id: 'Reminders', label: 'Pengingat', icon: Bell, hasBadge: true },
  { id: 'History', label: 'Riwayat', icon: History }
];

export default function MobileBottomNav({
  page,
  setPage,
  reminderCount = 0
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi Menu Bawah">
      {BOTTOM_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = page === item.id;
        const count = item.hasBadge ? reminderCount : 0;

        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-btn ${isActive ? 'is-active' : ''}`}
            onClick={() => {
              setPage(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="bottom-nav-icon-box">
              <Icon size={20} />
              {count > 0 && <span className="bottom-nav-badge">{count}</span>}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
            {isActive && <span className="bottom-nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
