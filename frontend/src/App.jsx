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
import {
  INITIAL_DEMO_MEMBERS,
  INITIAL_DEMO_SCHEDULES,
  INITIAL_DEMO_REMINDERS,
  INITIAL_DEMO_HISTORY
} from './api/demoData';

export default function App() {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('gymnasyum_token');
    if (!t || t === 'undefined' || t === 'null') {
      localStorage.removeItem('gymnasyum_token');
      return '';
    }
    return t;
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gymnasyum_user');
      if (!saved || saved === 'undefined' || saved === 'null') {
        localStorage.removeItem('gymnasyum_user');
        return null;
      }
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('gymnasyum_user');
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

    const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
    if (isDemo) {
      try {
        const sm = JSON.parse(localStorage.getItem('gymnasyum_demo_members')) || INITIAL_DEMO_MEMBERS;
        const ss = JSON.parse(localStorage.getItem('gymnasyum_demo_schedules')) || INITIAL_DEMO_SCHEDULES;
        const sr = JSON.parse(localStorage.getItem('gymnasyum_demo_reminders')) || INITIAL_DEMO_REMINDERS;
        const sh = JSON.parse(localStorage.getItem('gymnasyum_demo_history')) || INITIAL_DEMO_HISTORY;
        setMembers(sm);
        setSchedules(ss);
        setReminders(sr);
        setHistory(sh);
        setAllReminders(sr);
        setError('');
      } catch {
        setMembers(INITIAL_DEMO_MEMBERS);
        setSchedules(INITIAL_DEMO_SCHEDULES);
        setReminders(INITIAL_DEMO_REMINDERS);
        setHistory(INITIAL_DEMO_HISTORY);
        setAllReminders(INITIAL_DEMO_REMINDERS);
      }
      setRefreshing(false);
      return;
    }

    try {
      const [membersRes, schedulesRes, remindersTodayRes, historyRes, remindersRes] =
        await Promise.all([
          api.get('/members'),
          api.get('/schedules'),
          api.get('/reminders/today'),
          api.get('/history'),
          api.get('/reminders')
        ]);

      if (Array.isArray(membersRes.data) && Array.isArray(schedulesRes.data)) {
        setMembers(membersRes.data);
        setSchedules(schedulesRes.data);
        setReminders(Array.isArray(remindersTodayRes.data) ? remindersTodayRes.data : []);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        setAllReminders(Array.isArray(remindersRes.data) ? remindersRes.data : []);
        setError('');
      } else {
        throw new Error('Respon data backend bukan array');
      }
    } catch (err) {
      console.warn('Backend API tidak merespons, beralih ke dataset demo lokal:', err.message);
      // Fallback ke dataset demo agar UI tidak pernah blank screen
      setMembers(INITIAL_DEMO_MEMBERS);
      setSchedules(INITIAL_DEMO_SCHEDULES);
      setReminders(INITIAL_DEMO_REMINDERS);
      setHistory(INITIAL_DEMO_HISTORY);
      setAllReminders(INITIAL_DEMO_REMINDERS);
      setError('');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

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
    const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
    if (isDemo) {
      const cur = JSON.parse(localStorage.getItem('gymnasyum_demo_members')) || INITIAL_DEMO_MEMBERS;
      let updated;
      if (edit) {
        updated = cur.map((m) => (m.id === edit ? { ...m, ...form } : m));
      } else {
        const newM = {
          id: Date.now(),
          ...form,
          attendance_rate: 100,
          total_sessions: 0,
          present_count: 0,
          absent_count: 0,
          rescheduled_count: 0
        };
        updated = [newM, ...cur];
      }
      localStorage.setItem('gymnasyum_demo_members', JSON.stringify(updated));
      setEdit(null);
      setForm({ name: '', phone: '', email: '', membership_status: 'active', notes: '' });
      load();
      return;
    }

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
      const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
      if (isDemo) {
        const cur = JSON.parse(localStorage.getItem('gymnasyum_demo_members')) || INITIAL_DEMO_MEMBERS;
        const updated = cur.filter((m) => m.id !== id);
        localStorage.setItem('gymnasyum_demo_members', JSON.stringify(updated));
        load();
        return;
      }
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
    const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
    if (isDemo) {
      const cur = JSON.parse(localStorage.getItem('gymnasyum_demo_reminders')) || INITIAL_DEMO_REMINDERS;
      const updated = cur.map((r) => (r.id === id ? { ...r, status, note: note || r.note } : r));
      localStorage.setItem('gymnasyum_demo_reminders', JSON.stringify(updated));
      load();
      return;
    }
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
    const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
    const memberObj = members.find((m) => m.id === Number(scheduleForm.member_id));

    if (isDemo) {
      const cur = JSON.parse(localStorage.getItem('gymnasyum_demo_schedules')) || INITIAL_DEMO_SCHEDULES;
      let updated;
      if (scheduleEdit) {
        updated = cur.map((s) => (s.id === scheduleEdit ? { ...s, ...scheduleForm, member_name: memberObj?.name || 'Member' } : s));
      } else {
        const newS = {
          id: Date.now(),
          ...scheduleForm,
          member_id: Number(scheduleForm.member_id),
          member_name: memberObj?.name || 'Member',
          member_phone: memberObj?.phone || '081234567890'
        };
        updated = [newS, ...cur];

        // Buat reminder otomatis
        const curRem = JSON.parse(localStorage.getItem('gymnasyum_demo_reminders')) || INITIAL_DEMO_REMINDERS;
        const newRem = {
          id: Date.now() + 1,
          schedule_id: newS.id,
          member_id: newS.member_id,
          member_name: newS.member_name,
          member_phone: newS.member_phone,
          class_name: newS.class_name,
          session_type: newS.session_type,
          instructor_name: newS.instructor_name,
          starts_at: newS.starts_at,
          due_date: new Date().toISOString().split('T')[0],
          status: 'scheduled',
          priority: 'low'
        };
        localStorage.setItem('gymnasyum_demo_reminders', JSON.stringify([newRem, ...curRem]));
      }
      localStorage.setItem('gymnasyum_demo_schedules', JSON.stringify(updated));
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
      return;
    }

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
      const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
      if (isDemo) {
        const cur = JSON.parse(localStorage.getItem('gymnasyum_demo_schedules')) || INITIAL_DEMO_SCHEDULES;
        const updated = cur.filter((s) => s.id !== id);
        localStorage.setItem('gymnasyum_demo_schedules', JSON.stringify(updated));
        load();
        return;
      }
      try {
        await api.delete(`/schedules/${id}`);
        load();
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus jadwal');
      }
    }
  };

  const handleAttendanceChange = async (id, value) => {
    const isDemo = localStorage.getItem('gymnasyum_demo_mode') === 'true';
    if (isDemo) {
      const cur = JSON.parse(localStorage.getItem('gymnasyum_demo_schedules')) || INITIAL_DEMO_SCHEDULES;
      const updated = cur.map((s) => (s.id === id ? { ...s, attendance: value } : s));
      localStorage.setItem('gymnasyum_demo_schedules', JSON.stringify(updated));
      load();
      return;
    }
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
