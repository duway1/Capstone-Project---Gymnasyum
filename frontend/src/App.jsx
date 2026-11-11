import { useState, useEffect, useCallback } from 'react';
import api from './api/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import MembersPage from './pages/MembersPage';
import SchedulesPage from './pages/SchedulesPage';
import RemindersPage from './pages/RemindersPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';

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

  // Member form state
  const [form, setForm] = useState({ name: '', phone: '', membership_status: 'active' });
  const [edit, setEdit] = useState(null);

  // Schedule form state
  const [scheduleEdit, setScheduleEdit] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    member_id: '',
    class_name: '',
    starts_at: '',
    attendance: 'pending'
  });

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
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError('Backend belum terhubung. Pastikan PostgreSQL dan Express berjalan.');
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
      setForm({ name: '', phone: '', membership_status: 'active' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan member');
    }
  };

  const handleRemoveMember = async (id) => {
    if (confirm('Hapus member ini?')) {
      try {
        await api.delete(`/members/${id}`);
        load();
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus member');
      }
    }
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
      setError(err.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleOpenWhatsapp = async (r) => {
    try {
      const { data } = await api.get(`/reminders/${r.id}/message`);
      window.open(
        `https://wa.me/${data.phone}?text=${encodeURIComponent(data.message)}`,
        '_blank',
        'noopener,noreferrer'
      );
      if (r.status === 'scheduled') {
        await api.patch(`/reminders/${r.id}`, {
          status: 'opened',
          note: 'Tautan WhatsApp dibuka; belum tentu terkirim'
        });
      }
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuka WhatsApp');
    }
  };

  // Schedule handlers
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...scheduleForm,
        member_id: Number(scheduleForm.member_id),
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
      setError(err.response?.data?.error || 'Gagal mengubah kehadiran');
    }
  };

  // Jika belum login, tampilkan halaman Login
  if (!token || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="layout">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
        reminderCount={reminders.length}
      />

      <main>
        <Header
          page={page}
          user={user}
          onLogout={handleLogout}
          onRefresh={load}
          loading={refreshing}
        />

        {error && <div className="error">{error}</div>}

        {page === 'Overview' && (
          <OverviewPage
            members={members}
            schedules={schedules}
            reminders={reminders}
            whatsapp={handleOpenWhatsapp}
            update={handleUpdateReminderStatus}
            onNavigate={setPage}
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
          />
        )}

        {page === 'Reminders' && (
          <RemindersPage
            reminders={reminders}
            whatsapp={handleOpenWhatsapp}
            update={handleUpdateReminderStatus}
          />
        )}

        {page === 'History' && <HistoryPage history={history} />}
      </main>
    </div>
  );
}
