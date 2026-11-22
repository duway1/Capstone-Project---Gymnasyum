// Data simulasi demo untuk mode pratinjau cloud / backend offline

export const INITIAL_DEMO_MEMBERS = [
  {
    id: 1,
    name: 'Dwi Alfiyanti',
    phone: '081234567890',
    email: 'dwi.alfiyanti@gmail.com',
    membership_status: 'active',
    notes: 'Member aktif disiplin, fokus program Yoga dan Pilates penguatan postur.',
    attendance_rate: 90,
    total_sessions: 10,
    present_count: 9,
    absent_count: 1,
    rescheduled_count: 0
  },
  {
    id: 2,
    name: 'Budi Santoso',
    phone: '082198765432',
    email: 'budi.santoso@outlook.com',
    membership_status: 'active',
    notes: 'Pekerja kantor, sering lembur sehingga melewatkan 2 sesi latihan berturut-turut.',
    attendance_rate: 50,
    total_sessions: 8,
    present_count: 4,
    absent_count: 4,
    rescheduled_count: 0
  },
  {
    id: 3,
    name: 'Siti Rahma',
    phone: '081377889900',
    email: 'siti.rahma@yahoo.com',
    membership_status: 'active',
    notes: 'Sempat cedera pergelangan kaki ringan, butuh follow-up personal dan cek kondisi.',
    attendance_rate: 60,
    total_sessions: 6,
    present_count: 3,
    absent_count: 2,
    rescheduled_count: 1
  },
  {
    id: 4,
    name: 'Rizky Pratama',
    phone: '085711223344',
    email: 'rizky.pratama@gmail.com',
    membership_status: 'active',
    notes: 'Member kelas HIIT, sempat 1x absen dan pesan sebelumnya belum dibalas.',
    attendance_rate: 75,
    total_sessions: 8,
    present_count: 6,
    absent_count: 2,
    rescheduled_count: 0
  },
  {
    id: 5,
    name: 'Amanda Putri',
    phone: '087855667788',
    email: 'amanda.putri@gmail.com',
    membership_status: 'active',
    notes: 'Paket Private Coaching 1-on-1 dengan Coach Ryan. Ingin latihan fleksibel.',
    attendance_rate: 80,
    total_sessions: 5,
    present_count: 4,
    absent_count: 1,
    rescheduled_count: 0
  }
];

export const INITIAL_DEMO_SCHEDULES = [
  {
    id: 1,
    member_id: 1,
    member_name: 'Dwi Alfiyanti',
    member_phone: '081234567890',
    class_name: 'Morning Power Yoga',
    session_type: 'Group Class',
    instructor_name: 'Coach Maya',
    starts_at: new Date(Date.now() + 3600000).toISOString(),
    attendance: 'pending'
  },
  {
    id: 2,
    member_id: 2,
    member_name: 'Budi Santoso',
    member_phone: '082198765432',
    class_name: 'Upper Body Hypertrophy',
    session_type: 'Group Class',
    instructor_name: 'Coach Dimas',
    starts_at: new Date(Date.now() + 7200000).toISOString(),
    attendance: 'pending'
  },
  {
    id: 3,
    member_id: 3,
    member_name: 'Siti Rahma',
    member_phone: '081377889900',
    class_name: 'Mobility & Rehab Stretch',
    session_type: 'Private Coaching',
    instructor_name: 'Coach Sarah',
    starts_at: new Date(Date.now() + 10800000).toISOString(),
    attendance: 'pending'
  },
  {
    id: 4,
    member_id: 4,
    member_name: 'Rizky Pratama',
    member_phone: '085711223344',
    class_name: 'High Intensity Interval Training',
    session_type: 'Group Class',
    instructor_name: 'Coach Ryan',
    starts_at: new Date(Date.now() + 14400000).toISOString(),
    attendance: 'pending'
  },
  {
    id: 5,
    member_id: 5,
    member_name: 'Amanda Putri',
    member_phone: '087855667788',
    class_name: 'Private Fat Loss Transformation',
    session_type: 'Private Coaching',
    instructor_name: 'Coach Ryan',
    starts_at: new Date(Date.now() + 18000000).toISOString(),
    attendance: 'pending'
  }
];

export const INITIAL_DEMO_REMINDERS = [
  {
    id: 1,
    schedule_id: 1,
    member_id: 1,
    member_name: 'Dwi Alfiyanti',
    member_phone: '081234567890',
    class_name: 'Morning Power Yoga',
    session_type: 'Group Class',
    instructor_name: 'Coach Maya',
    starts_at: new Date(Date.now() + 3600000).toISOString(),
    due_date: new Date().toISOString().split('T')[0],
    status: 'scheduled',
    priority: 'low',
    priority_reason: 'Member disiplin dan kehadiran teratur.',
    recommended_action: 'Pengingat santun standar persiapan latihan.'
  },
  {
    id: 2,
    schedule_id: 2,
    member_id: 2,
    member_name: 'Budi Santoso',
    member_phone: '082198765432',
    class_name: 'Upper Body Hypertrophy',
    session_type: 'Group Class',
    instructor_name: 'Coach Dimas',
    starts_at: new Date(Date.now() + 7200000).toISOString(),
    due_date: new Date().toISOString().split('T')[0],
    status: 'scheduled',
    priority: 'high',
    priority_reason: 'Mangkir (absent) >= 2 kali dalam 14 hari terakhir.',
    recommended_action: 'Pendekatan personal empati & cek kendala.'
  },
  {
    id: 3,
    schedule_id: 3,
    member_id: 3,
    member_name: 'Siti Rahma',
    member_phone: '081377889900',
    class_name: 'Mobility & Rehab Stretch',
    session_type: 'Private Coaching',
    instructor_name: 'Coach Sarah',
    starts_at: new Date(Date.now() + 10800000).toISOString(),
    due_date: new Date().toISOString().split('T')[0],
    status: 'sent',
    priority: 'high',
    priority_reason: 'Riwayat absen tinggi & butuh follow-up kondisi cedera.',
    recommended_action: 'Pendekatan personal empati & atasi kendala.'
  },
  {
    id: 4,
    schedule_id: 4,
    member_id: 4,
    member_name: 'Rizky Pratama',
    member_phone: '085711223344',
    class_name: 'High Intensity Interval Training',
    session_type: 'Group Class',
    instructor_name: 'Coach Ryan',
    starts_at: new Date(Date.now() + 14400000).toISOString(),
    due_date: new Date().toISOString().split('T')[0],
    status: 'no_response',
    priority: 'medium',
    priority_reason: 'Pernah absen 1x dan pesan sesi sebelumnya tanpa respon.',
    recommended_action: 'Konfirmasi kuota kelas & tawarkan reschedule fleksibel.'
  },
  {
    id: 5,
    schedule_id: 5,
    member_id: 5,
    member_name: 'Amanda Putri',
    member_phone: '087855667788',
    class_name: 'Private Fat Loss Transformation',
    session_type: 'Private Coaching',
    instructor_name: 'Coach Ryan',
    starts_at: new Date(Date.now() + 18000000).toISOString(),
    due_date: new Date().toISOString().split('T')[0],
    status: 'responded',
    priority: 'medium',
    priority_reason: 'Konfirmasi kehadiran sudah diterima dari member.',
    recommended_action: 'Siapkan alat & ruang sesi private.'
  }
];

export const INITIAL_DEMO_HISTORY = [
  {
    id: 1,
    member_id: 5,
    member_name: 'Amanda Putri',
    channel: 'whatsapp',
    action: 'responded',
    note: 'Member konfirmasi hadir tepat waktu untuk sesi Private Coaching.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    member_id: 3,
    member_name: 'Siti Rahma',
    channel: 'whatsapp',
    action: 'sent',
    note: 'Pesan pengingat sesi peregangan terkirim via WhatsApp Web.',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3,
    member_id: 4,
    member_name: 'Rizky Pratama',
    channel: 'whatsapp',
    action: 'no_response',
    note: 'Pesan pengingat terkirim namun belum ada konfirmasi dari member.',
    created_at: new Date(Date.now() - 14400000).toISOString()
  }
];
