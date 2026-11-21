import { useState, useEffect, useCallback } from 'react';
import api from './api/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import OverviewPage from './pages/OverviewPage';
import MembersPage from './pages/MembersPage';
import SchedulesPage from './pages/SchedulesPage';
import RemindersPage from './pages/RemindersPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import MessageDrafterModal from './components/MessageDrafterModal';
import ReminderTimelineModal from './components/ReminderTimelineModal';
import ManualLogModal from './components/ManualLogModal';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gymnasyum_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gymnasyum_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState('Overview');
  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [history, setHistory] = useState([]);
  const [allReminders, setAllReminders] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [generatingDataset, setGeneratingDataset] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Responsive Sidebar & Mobile Drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('gymnasyum_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global modals state
  const [drafterReminderId, setDrafterReminderId] = useState(null);
  const [timelineReminderId, setTimelineReminderId] = useState(null);
  const [globalLogModalOpen, setGlobalLogModalOpen] = useState(false);

  // Member form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    membership_status: 'active',
    notes: ''
  });
  const [edit, setEdit] = useState(null);

  // Schedule form state (supports Group Class & Private Coaching)
  const [scheduleEdit, setScheduleEdit] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    member_id: '',
    class_name: '',
    session_type: 'Group Class',
    instructor_name: 'Coach Gymnasyum',
    starts_at: '',
    attendance: 'pending'
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gymnasyum_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('gymnasyum_token');
    localStorage.removeItem('gymnasyum_user');
    setToken('');
    setUser(null);
    setMembers([]);
    setSchedules([]);
    setReminders([]);
    setHistory([]);
    setAllReminders([]);
    setError('');
  }, []);

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setError('');
  };

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const [membersRes, schedulesRes, remindersTodayRes, historyRes, remindersRes] =
        await Promise.all([
          api.get('/members'),
          api.get('/schedules'),
          api.get('/reminders/today'),
          api.get('/history'),
          api.get('/reminders')
        ]);

      setMembers(membersRes.data);
      setSchedules(schedulesRes.data);
      setReminders(remindersTodayRes.data);
      setHistory(historyRes.data);
      setAllReminders(remindersRes.data);
      setError('');
    } catch (err) {
      console.error('Error saat memuat data aplikasi:', err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        const detail = err.response?.data?.error || err.message;
        setError(detail ? `Kendala koneksi backend: ${detail}` : 'Backend belum terhubung. Pastikan server API backend berjalan.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    const onUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('gymnasyum:logout', onUnauthorized);
    return () => {
      window.removeEventListener('gymnasyum:logout', onUnauthorized);
    };
  }, [handleLogout]);

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token, load]);

  // Synthetic Dataset Generator Handler (Tool #6 Capstone Project)
  const handleGenerateSyntheticData = async () => {
    setGeneratingDataset(true);
    try {
      const res = await api.post('/dataset/generate');
      setToastMessage(res.data.message || 'Synthetic dataset operasional Gymnasyum berhasil dimuat!');
      await load();
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err) {
      setError('Gagal membuat data simulasi: ' + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingDataset(false);
    }
  };

  // Quick Action Handler from Header / Sidebar
  const handleQuickAction = (action) => {
    if (action === 'add-member') {
      setEdit(null);
      setForm({
        name: '',
        phone: '',
        email: '',
        membership_status: 'active',
        notes: ''
      });
      setPage('Members');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'add-schedule') {
      setScheduleEdit(null);
      setScheduleForm({
        member_id: '',
        class_name: '',
        session_type: 'Group Class',
        instructor_name: 'Coach Gymnasyum',
        starts_at: '',
        attendance: 'pending'
      });
      setPage('Schedules');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'log-communication') {
      setGlobalLogModalOpen(true);
    } else if (action === 'view-reminders') {
      setPage('Reminders');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Member handlers
  const handleSaveMember = async (e) => {
    e.preventDefault();
    try {
      if (edit) {
        await api.put(`/members/${edit}`, form);
      } else {
        await api.post('/members', form);
      }
      setEdit(null);
      setForm({ name: '', phone: '', email: '', membership_status: 'active', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data pelanggan');
    }
  };

  const handleRemoveMember = async (id) => {
    if (confirm('Hapus pelanggan ini beserta seluruh jadwal dan riwayat terkait?')) {
      try {
        await api.delete(`/members/${id}`);
        load();
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus pelanggan');
      }
    }
  };

  const handleAddScheduleForMember = (member) => {
    setScheduleEdit(null);
    setScheduleForm({
      member_id: String(member.id),
      class_name: '',
      session_type: 'Group Class',
      instructor_name: 'Coach Gymnasyum',
      starts_at: '',
      attendance: 'pending'
    });
    setPage('Schedules');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reminder handlers
  const handleUpdateReminderStatus = async (id, status, note = '') => {
    try {
      await api.patch(`/reminders/${id}`, {
        status,
        note: typeof note === 'string' ? note : ''
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah status pengingat');
    }
  };

  const handleOpenWhatsapp = async (r) => {
    setDrafterReminderId(r.id);
  };

  // Schedule handlers
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...scheduleForm,
        member_id: Number(scheduleForm.member_id),
        session_type: scheduleForm.session_type || 'Group Class',
        instructor_name: scheduleForm.instructor_name || 'Coach Gymnasyum',
        starts_at: new Date(scheduleForm.starts_at).toISOString()
      };
      if (scheduleEdit) {
        await api.put(`/schedules/${scheduleEdit}`, data);
      } else {
        await api.post('/schedules', data);
      }
      setScheduleEdit(null);
      setScheduleForm({
        member_id: '',
        class_name: '',
        session_type: 'Group Class',
        instructor_name: 'Coach Gymnasyum',
        starts_at: '',
        attendance: 'pending'
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan jadwal');
    }
  };

  const handleEditSchedule = (s) => {
    setScheduleEdit(s.id);
    const date = new Date(s.starts_at);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduleForm({
      member_id: String(s.member_id),
      class_name: s.class_name,
      session_type: s.session_type || 'Group Class',
      instructor_name: s.instructor_name || 'Coach Gymnasyum',
      starts_at: local,
      attendance: s.attendance
    });
  };

  const handleDeleteSchedule = async (id) => {
    if (confirm('Hapus jadwal dan reminder terkait?')) {
      try {
        await api.delete(`/schedules/${id}`);
        load();
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus jadwal');
      }
    }
  };

  const handleAttendanceChange = async (id, value) => {
    try {
      await api.patch(`/schedules/${id}/attendance`, { attendance: value });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah status presensi');
    }
  };

  // Jika belum login, tampilkan halaman Login
  if (!token || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
        reminderCount={reminders.length}
        membersCount={members.length}
        schedulesCount={schedules.length}
        historyCount={history.length}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onQuickAction={handleQuickAction}
      />

      <main className="main-content-area">
        <Header
          page={page}
          setPage={setPage}
          user={user}
          onLogout={handleLogout}
          onRefresh={load}
          loading={refreshing}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapsed}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onQuickAction={handleQuickAction}
        />

        {toastMessage && (
          <div className="toast-notification-banner">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {page === 'Overview' && (
          <OverviewPage
            members={members}
            schedules={schedules}
            reminders={reminders}
            whatsapp={handleOpenWhatsapp}
            update={handleUpdateReminderStatus}
            onNavigate={setPage}
            onOpenMessageDrafter={(id) => setDrafterReminderId(id)}
            onOpenTimeline={(id) => setTimelineReminderId(id)}
          />
        )}

        {page === 'Members' && (
          <MembersPage
            members={members}
            form={form}
            setForm={setForm}
            edit={edit}
            setEdit={setEdit}
            onSave={handleSaveMember}
            onRemove={handleRemoveMember}
            onAddScheduleForMember={handleAddScheduleForMember}
          />
        )}

        {page === 'Schedules' && (
          <SchedulesPage
            schedules={schedules}
            members={members}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            scheduleEdit={scheduleEdit}
            setScheduleEdit={setScheduleEdit}
            onSaveSchedule={handleSaveSchedule}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onAttendanceChange={handleAttendanceChange}
            onOpenMessageDrafter={(id) => setDrafterReminderId(id)}
          />
        )}

        {page === 'Reminders' && (
          <RemindersPage
            reminders={reminders}
            allReminders={allReminders}
            whatsapp={handleOpenWhatsapp}
            update={handleUpdateReminderStatus}
            onRefreshData={load}
          />
        )}

        {page === 'History' && (
          <HistoryPage
            history={history}
            members={members}
            onLogAdded={load}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        page={page}
        setPage={setPage}
        reminderCount={reminders.length}
      />

      {/* Global Message Drafter Modal (Priority Logic & Automated Messages) */}
      <MessageDrafterModal
        isOpen={Boolean(drafterReminderId)}
        onClose={() => setDrafterReminderId(null)}
        reminderId={drafterReminderId}
        onMessageSent={load}
      />

      {/* Global Reminder Timeline Tracker Modal (End-to-End Status Tracking) */}
      <ReminderTimelineModal
        isOpen={Boolean(timelineReminderId)}
        onClose={() => setTimelineReminderId(null)}
        reminderId={timelineReminderId}
        onStatusUpdated={load}
      />

      {/* Global Quick Communication Log Modal */}
      <ManualLogModal
        isOpen={globalLogModalOpen}
        onClose={() => setGlobalLogModalOpen(false)}
        members={members}
        onLogAdded={load}
      />
    </div>
  );
}
