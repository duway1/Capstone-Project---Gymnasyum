/**
 * Seeder data simulasi operasional Gymnasyum CRM
 */

import { query, getClient } from './db.js';

export const SYNTHETIC_MEMBERS = [
  {
    name: 'Dwi Alfiyanti',
    phone: '081234567890',
    email: 'dwi.alfiyanti@gmail.com',
    membership_status: 'active',
    notes: 'Member aktif disiplin, fokus program Yoga dan Pilates penguatan postur.',
    persona: 'low_priority_regular'
  },
  {
    name: 'Budi Santoso',
    phone: '082198765432',
    email: 'budi.santoso@outlook.com',
    membership_status: 'active',
    notes: 'Pekerja kantor, sering lembur sehingga melewatkan 2 sesi latihan berturut-turut.',
    persona: 'high_priority_absent'
  },
  {
    name: 'Siti Rahma',
    phone: '081377889900',
    email: 'siti.rahma@yahoo.com',
    membership_status: 'active',
    notes: 'Sempat cedera pergelangan kaki ringan, butuh follow-up personal dan cek kondisi.',
    persona: 'high_priority_at_risk'
  },
  {
    name: 'Rizky Pratama',
    phone: '085711223344',
    email: 'rizky.pratama@gmail.com',
    membership_status: 'active',
    notes: 'Member kelas HIIT, sempat 1x absen dan pesan sebelumnya belum dibalas.',
    persona: 'medium_priority_pending'
  },
  {
    name: 'Amanda Putri',
    phone: '087855667788',
    email: 'amanda.putri@gmail.com',
    membership_status: 'active',
    notes: 'Paket Private Coaching 1-on-1 dengan Coach Ryan. Ingin latihan fleksibel.',
    persona: 'medium_priority_reschedule'
  },
  {
    name: 'Kevin Wijaya',
    phone: '081900112233',
    email: 'kevin.wijaya@gmail.com',
    membership_status: 'active',
    notes: 'Member gold keanggotaan tahunan, disiplin latihan angkat beban (Strength Training).',
    persona: 'low_priority_regular'
  },
  {
    name: 'Dimas Anggara',
    phone: '081244556677',
    email: 'dimas.anggara@gmail.com',
    membership_status: 'active',
    notes: 'Rutin ikut kelas Body Pump setiap Selasa dan Jumat malam.',
    persona: 'low_priority_regular'
  },
  {
    name: 'Hendra Kusuma',
    phone: '085699887766',
    email: 'hendra.kusuma@corp.id',
    membership_status: 'active',
    notes: 'Eksekutif perusahaan, sering tugas dinas luar kota. Sudah 3x absen dalam 14 hari.',
    persona: 'high_priority_chronic_absent'
  },
  {
    name: 'Nadia Safira',
    phone: '081322334455',
    email: 'nadia.safira@gmail.com',
    membership_status: 'active',
    notes: 'Private Coaching Functional Fitness bersama Coach Maya. Progres sangat baik.',
    persona: 'low_priority_regular'
  },
  {
    name: 'Farah Anindita',
    phone: '087712349876',
    email: 'farah.anindita@gmail.com',
    membership_status: 'active',
    notes: 'Member Pilates Core Balance, selalu konfirmasi cepat via WhatsApp.',
    persona: 'low_priority_regular'
  },
  {
    name: 'Bagus Triyanto',
    phone: '081299881122',
    email: 'bagus.triyanto@gmail.com',
    membership_status: 'active',
    notes: 'Sempat izin absen 1x karena acara keluarga, siap kembali sesi berikutnya.',
    persona: 'medium_priority_confirm'
  },
  {
    name: 'Clarissa Dewi',
    phone: '081877665544',
    email: 'clarissa.dewi@gmail.com',
    membership_status: 'inactive',
    notes: 'Status keanggotaan sedang dihentikan sementara (cuti gym).',
    persona: 'inactive'
  }
];

export async function generateSyntheticData(reset = false) {
  const client = await getClient();
  try {
    console.log('🔄 [Synthetic Generator] Memulai pembuatan synthetic dataset operasional Gymnasyum...');

    if (reset) {
      await client.query('DELETE FROM communication_logs');
      await client.query('DELETE FROM reminders');
      await client.query('DELETE FROM schedules');
      await client.query('DELETE FROM members');
      console.log('🧹 [Synthetic Generator] Data lama berhasil dibersihkan.');
    }

    // 1. Insert Members
    const memberMap = new Map();
    for (const m of SYNTHETIC_MEMBERS) {
      const existing = await client.query('SELECT id FROM members WHERE phone = $1', [m.phone]);
      let memberId;
      if (existing.rowCount > 0) {
        memberId = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO members (name, phone, email, membership_status, notes)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [m.name, m.phone, m.email, m.membership_status, m.notes]
        );
        memberId = ins.rows[0].id;
      }
      memberMap.set(m.persona, { id: memberId, ...m });
    }

    // Dates helpers (Asia/Jakarta ISO string)
    const now = new Date();
    const getDateOffset = (dayOffset, hour = 9, minute = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };

    // 2. Generate Synthetic Historical Schedules (Past 14 Days) to create realistic attendance profiles
    const historicalPlans = [
      // Budi Santoso (High Priority: 2x absent in past 14 days)
      { memberPersona: 'high_priority_absent', class: 'HIIT Cardio Blast', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 10, att: 'absent' },
      { memberPersona: 'high_priority_absent', class: 'Body Pump & Sculpt', type: 'Group Class', coach: 'Coach Ryan', daysAgo: 5, att: 'absent' },
      { memberPersona: 'high_priority_absent', class: 'Strength Training', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 2, att: 'present' },

      // Hendra Kusuma (High Priority: 3x absent in past 14 days)
      { memberPersona: 'high_priority_chronic_absent', class: 'Private Coaching 1-on-1', type: 'Private Coaching', coach: 'Coach Ryan', daysAgo: 12, att: 'absent' },
      { memberPersona: 'high_priority_chronic_absent', class: 'Private Coaching 1-on-1', type: 'Private Coaching', coach: 'Coach Ryan', daysAgo: 8, att: 'absent' },
      { memberPersona: 'high_priority_chronic_absent', class: 'Private Coaching 1-on-1', type: 'Private Coaching', coach: 'Coach Ryan', daysAgo: 3, att: 'absent' },

      // Siti Rahma (High Priority: 2x absent, injury)
      { memberPersona: 'high_priority_at_risk', class: 'Pilates Core Balance', type: 'Group Class', coach: 'Coach Maya', daysAgo: 9, att: 'absent' },
      { memberPersona: 'high_priority_at_risk', class: 'Yoga Morning Flow', type: 'Group Class', coach: 'Coach Maya', daysAgo: 4, att: 'absent' },

      // Rizky Pratama (Medium Priority: 1x absent)
      { memberPersona: 'medium_priority_pending', class: 'HIIT Cardio Blast', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 7, att: 'present' },
      { memberPersona: 'medium_priority_pending', class: 'HIIT Cardio Blast', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 3, att: 'absent' },

      // Bagus Triyanto (Medium Priority: 1x absent)
      { memberPersona: 'medium_priority_confirm', class: 'Body Pump & Sculpt', type: 'Group Class', coach: 'Coach Ryan', daysAgo: 6, att: 'absent' },
      { memberPersona: 'medium_priority_confirm', class: 'Strength Training', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 2, att: 'present' },

      // Dwi Alfiyanti (Low Priority: 100% Present)
      { memberPersona: 'low_priority_regular', class: 'Yoga Morning Flow', type: 'Group Class', coach: 'Coach Maya', daysAgo: 11, att: 'present' },
      { memberPersona: 'low_priority_regular', class: 'Pilates Core Balance', type: 'Group Class', coach: 'Coach Maya', daysAgo: 7, att: 'present' },
      { memberPersona: 'low_priority_regular', class: 'Yoga Morning Flow', type: 'Group Class', coach: 'Coach Maya', daysAgo: 3, att: 'present' },

      // Kevin Wijaya (Low Priority: Present)
      { memberPersona: 'low_priority_regular', class: 'Strength Training', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 9, att: 'present' },
      { memberPersona: 'low_priority_regular', class: 'Strength Training', type: 'Group Class', coach: 'Coach Dimas', daysAgo: 4, att: 'present' }
    ];

    for (const hp of historicalPlans) {
      const member = memberMap.get(hp.memberPersona);
      if (!member) continue;
      const startsAt = getDateOffset(-hp.daysAgo, 18, 0);
      const dueDate = startsAt.substring(0, 10);

      const sRes = await client.query(
        `INSERT INTO schedules (member_id, class_name, session_type, instructor_name, starts_at, attendance)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [member.id, hp.class, hp.type, hp.coach, startsAt, hp.att]
      );
      const scheduleId = sRes.rows[0].id;

      // Completed past reminder
      await client.query(
        `INSERT INTO reminders (member_id, schedule_id, due_date, status, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [member.id, scheduleId, dueDate, hp.att === 'present' ? 'responded' : 'no_response', `Sesi lampau (${hp.att})`]
      );
    }

    // 3. Generate Today's Schedules & Active Reminders (Demonstrates High, Medium, Low in Dashboard!)
    const todaySessions = [
      {
        memberPersona: 'high_priority_absent', // Budi Santoso (High Priority)
        class: 'HIIT Cardio Blast',
        type: 'Group Class',
        coach: 'Coach Dimas',
        hour: 19,
        minute: 0,
        reminderStatus: 'scheduled',
        reminderNote: 'Prioritas Tinggi: 2x absen berturut-turut. Butuh follow-up personal.'
      },
      {
        memberPersona: 'high_priority_chronic_absent', // Hendra Kusuma (High Priority)
        class: 'Private Coaching 1-on-1',
        type: 'Private Coaching',
        coach: 'Coach Ryan',
        hour: 16,
        minute: 30,
        reminderStatus: 'sent',
        reminderNote: 'Pesan draf empati terkirim via WhatsApp Web pada 09:15 WIB.'
      },
      {
        memberPersona: 'medium_priority_pending', // Rizky Pratama (Medium Priority)
        class: 'HIIT Cardio Blast',
        type: 'Group Class',
        coach: 'Coach Dimas',
        hour: 19,
        minute: 0,
        reminderStatus: 'no_response',
        reminderNote: 'Pesan sudah dikirim kemarin sore, belum ada respons balasan.'
      },
      {
        memberPersona: 'medium_priority_confirm', // Bagus Triyanto (Medium Priority)
        class: 'Strength Training',
        type: 'Group Class',
        coach: 'Coach Dimas',
        hour: 17,
        minute: 30,
        reminderStatus: 'scheduled',
        reminderNote: 'Konfirmasi kuota kelas sesi sore ini.'
      },
      {
        memberPersona: 'low_priority_regular', // Dwi Alfiyanti (Low Priority)
        class: 'Yoga Morning Flow',
        type: 'Group Class',
        coach: 'Coach Maya',
        hour: 18,
        minute: 0,
        reminderStatus: 'responded',
        reminderNote: 'Member mengonfirmasi hadir tepat waktu via WhatsApp.'
      },
      {
        memberPersona: 'low_priority_regular', // Kevin Wijaya (Low Priority)
        class: 'Body Pump & Sculpt',
        type: 'Group Class',
        coach: 'Coach Ryan',
        hour: 20,
        minute: 0,
        reminderStatus: 'scheduled',
        reminderNote: 'Pengingat standar ramah terjadwal.'
      }
    ];

    const todayDateStr = getDateOffset(0, 0, 0).substring(0, 10);

    for (const ts of todaySessions) {
      const member = memberMap.get(ts.memberPersona);
      if (!member) continue;
      const startsAt = getDateOffset(0, ts.hour, ts.minute);

      const sRes = await client.query(
        `INSERT INTO schedules (member_id, class_name, session_type, instructor_name, starts_at, attendance)
         VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
        [member.id, ts.class, ts.type, ts.coach, startsAt]
      );
      const scheduleId = sRes.rows[0].id;

      const remRes = await client.query(
        `INSERT INTO reminders (member_id, schedule_id, due_date, status, note)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [member.id, scheduleId, todayDateStr, ts.reminderStatus, ts.reminderNote]
      );
      const reminderId = remRes.rows[0].id;

      // Add realistic Communication Logs for today's reminders
      if (ts.reminderStatus === 'sent' || ts.reminderStatus === 'responded' || ts.reminderStatus === 'no_response') {
        await client.query(
          `INSERT INTO communication_logs (reminder_id, member_id, channel, action, note)
           VALUES ($1, $2, 'whatsapp', 'sent', $3)`,
          [reminderId, member.id, `Draf pengingat WhatsApp terkirim ke nomor ${member.phone}`]
        );
      }

      if (ts.reminderStatus === 'responded') {
        await client.query(
          `INSERT INTO communication_logs (reminder_id, member_id, channel, action, note)
           VALUES ($1, $2, 'whatsapp', 'responded', 'Member membalas konfirmasi hadir tepat waktu.')`,
          [reminderId, member.id]
        );
      } else if (ts.reminderStatus === 'no_response') {
        await client.query(
          `INSERT INTO communication_logs (reminder_id, member_id, channel, action, note)
           VALUES ($1, $2, 'whatsapp', 'no_response', 'Batas waktu tunggu 3 jam terlewati tanpa balasan.')`,
          [reminderId, member.id]
        );
      }
    }

    // 4. Generate Tomorrow's Schedules
    const tomorrowDateStr = getDateOffset(1, 0, 0).substring(0, 10);
    const tomorrowSessions = [
      { memberPersona: 'low_priority_regular', class: 'Pilates Core Balance', type: 'Group Class', coach: 'Coach Maya', hour: 9, minute: 0 },
      { memberPersona: 'medium_priority_reschedule', class: 'Private Coaching 1-on-1', type: 'Private Coaching', coach: 'Coach Ryan', hour: 15, minute: 0 },
      { memberPersona: 'high_priority_at_risk', class: 'Yoga Recovery', type: 'Group Class', coach: 'Coach Maya', hour: 18, minute: 30 }
    ];

    for (const tms of tomorrowSessions) {
      const member = memberMap.get(tms.memberPersona);
      if (!member) continue;
      const startsAt = getDateOffset(1, tms.hour, tms.minute);

      const sRes = await client.query(
        `INSERT INTO schedules (member_id, class_name, session_type, instructor_name, starts_at, attendance)
         VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
        [member.id, tms.class, tms.type, tms.coach, startsAt]
      );
      const scheduleId = sRes.rows[0].id;

      await client.query(
        `INSERT INTO reminders (member_id, schedule_id, due_date, status, note)
         VALUES ($1, $2, $3, 'scheduled', 'Pengingat untuk jadwal besok.')`,
        [member.id, scheduleId, tomorrowDateStr]
      );
    }

    console.log('🎉 [Synthetic Generator] Berhasil menghasilkan synthetic dataset operasional lengkap!');
    return {
      success: true,
      membersCount: memberMap.size,
      todayRemindersCount: todaySessions.length,
      tomorrowRemindersCount: tomorrowSessions.length
    };
  } finally {
    client.release();
  }
}

// If executed directly from command line (node datasetGenerator.js)
if (process.argv[1]?.includes('datasetGenerator.js')) {
  import('./db.js').then(async ({ initDatabase }) => {
    await initDatabase();
    await generateSyntheticData(true);
    process.exit(0);
  });
}

export default {
  SYNTHETIC_MEMBERS,
  generateSyntheticData
};
