/**
 * Modul evaluasi prioritas retensi pelanggan dan rekomendasi follow-up
 */

export const FOLLOW_UP_TEMPLATES = [
  {
    id: 'low_priority_reminder',
    title: 'Pengingat Standar Ramah',
    targetPriority: 'low',
    category: 'reminder',
    description: 'Pengingat santun untuk member reguler dengan kehadiran baik.',
    templateText:
      'Halo {nama}, salam sehat dari Gymnasyum! Kami ingin mengingatkan jadwal {tipe_sesi} {kelas} Anda pada {hari_tanggal_jam} WIB bersama {instruktur}. Jangan lupa bawa perlengkapan latihan dan botol minum Anda. Sampai jumpa di gym!'
  },
  {
    id: 'medium_priority_confirm',
    title: 'Konfirmasi Kuota Kelas',
    targetPriority: 'medium',
    category: 'confirmation',
    description: 'Permintaan konfirmasi cepat karena kuota kelas terbatas atau member sempat 1x absen.',
    templateText:
      'Halo {nama}, kami dari Gymnasyum ingin mengonfirmasi kehadiran Anda di sesi {kelas} pada {hari_tanggal_jam} WIB. Karena slot peserta terbatas, mohon konfirmasi kesiapan Anda ya. Terima kasih banyak!'
  },
  {
    id: 'high_priority_empower',
    title: 'Pendekatan Personal & Cek Kendala',
    targetPriority: 'high',
    category: 'at_risk',
    description: 'Pendekatan empati khusus untuk member yang sering melewatkan kelas belakangan ini.',
    templateText:
      'Halo {nama}! Kami dari tim Gymnasyum menyapa Anda. Kami perhatikan Anda sempat melewatkan beberapa sesi latihan belakangan ini. Apakah ada kendala jadwal atau kondisi fisik? Sesi {kelas} berikutnya dijadwalkan pada {hari_tanggal_jam} WIB. Kami siap bantu sesuaikan program latihan agar Anda tetap konsisten berolahraga!'
  },
  {
    id: 'follow_up_no_response',
    title: 'Follow-Up Lanjutan Tanpa Respon',
    targetPriority: 'medium',
    category: 'follow_up',
    description: 'Tindak lanjut kedua jika member belum membalas pesan sebelumnya.',
    templateText:
      'Halo {nama}, kami menindaklanjuti pesan pengingat sebelumnya untuk kelas {kelas} pada {hari_tanggal_jam} WIB. Apakah Anda masih berencana hadir, atau ingin kami bantu jadwalkan ulang? Mohon konfirmasinya ya.'
  },
  {
    id: 'reschedule_offer',
    title: 'Penawaran Reschedule Fleksibel',
    targetPriority: 'all',
    category: 'reschedule',
    description: 'Membantu member yang berhalangan hadir untuk memilih slot waktu pengganti.',
    templateText:
      'Halo {nama}, tidak masalah jika Anda berhalangan hadir di sesi {kelas} ini. Kapan waktu yang lebih luang bagi Anda untuk sesi pengganti minggu ini? Kami siap membantu menyiapkan jadwal baru untuk Anda.'
  },
  {
    id: 'post_attendance_appreciation',
    title: 'Apresiasi Pasca-Latihan',
    targetPriority: 'all',
    category: 'appreciation',
    description: 'Ucapan apresiasi positif setelah member menyelesaikan latihan di gym.',
    templateText:
      'Halo {nama}, semangat yang luar biasa di sesi {kelas} hari ini! Tetap jaga kebugaran dan pola istirahat Anda. Sampai jumpa di latihan berikutnya di Gymnasyum!'
  }
];

/**
 * Evaluates priority classification for a member based on attendance and reminder history
 */
export async function evaluateMemberPriority(memberId, db) {
  // Query attendance stats in the last 14 days
  const statsRes = await db.query(
    `SELECT
      COUNT(*) AS total_schedules_14d,
      COUNT(CASE WHEN attendance = 'present' THEN 1 END) AS present_count_14d,
      COUNT(CASE WHEN attendance = 'absent' THEN 1 END) AS absent_count_14d,
      COUNT(CASE WHEN attendance = 'rescheduled' THEN 1 END) AS rescheduled_count_14d
    FROM schedules
    WHERE member_id = $1 AND starts_at >= NOW() - INTERVAL '14 days'`,
    [memberId]
  );
  const stats = statsRes.rows[0] || {};
  const absentCount14d = Number(stats.absent_count_14d) || 0;
  const presentCount14d = Number(stats.present_count_14d) || 0;
  const totalSchedules14d = Number(stats.total_schedules_14d) || 0;

  // Query latest reminder status
  const latestReminderRes = await db.query(
    `SELECT status, due_date FROM reminders WHERE member_id = $1 ORDER BY due_date DESC LIMIT 1`,
    [memberId]
  );
  const latestReminder = latestReminderRes.rows[0];
  const hadNoResponse = latestReminder?.status === 'no_response';

  // Query current or upcoming schedule attendance
  const upcomingRes = await db.query(
    `SELECT attendance, class_name, starts_at, session_type, instructor_name
     FROM schedules
     WHERE member_id = $1 AND starts_at >= date('now')
     ORDER BY starts_at ASC LIMIT 1`,
    [memberId]
  );
  const upcomingSchedule = upcomingRes.rows[0];
  const isCurrentAbsent = upcomingSchedule?.attendance === 'absent';

  // Rule-based Priority Inference Engine
  let priority = 'low';
  let score = 25;
  let reason = 'Presensi aktif teratur & tidak ada catatan mangkir dalam 14 hari terakhir.';
  let recommendedAction = 'Kirimkan pengingat standar persiapan latihan.';
  let recommendedTemplateId = 'low_priority_reminder';

  if (absentCount14d >= 2) {
    priority = 'high';
    score = 90;
    reason = `Absen ${absentCount14d}x dalam 14 hari terakhir (Berisiko tinggi mangkir / berhenti latihan).`;
    recommendedAction = 'Hubungi member dengan pendekatan personal empati, tanyakan kendala jadwal atau kesehatan fisik.';
    recommendedTemplateId = 'high_priority_empower';
  } else if (isCurrentAbsent) {
    priority = 'medium';
    score = 65;
    reason = 'Sesi saat ini ditandai Tidak Hadir (Perlu penjadwalan ulang / reschedule).';
    recommendedAction = 'Tawarkan slot waktu sesi pengganti agar sesi latihan member tidak hangus.';
    recommendedTemplateId = 'reschedule_offer';
  } else if (hadNoResponse) {
    priority = 'medium';
    score = 60;
    reason = 'Pesan pengingat sesi sebelumnya belum ada balasan dari member.';
    recommendedAction = 'Kirim follow-up lanjutan untuk memastikan kepastian kehadiran slot kelas.';
    recommendedTemplateId = 'follow_up_no_response';
  } else if (absentCount14d === 1) {
    priority = 'medium';
    score = 50;
    reason = 'Pernah absen 1x dalam 14 hari terakhir (Butuh konfirmasi kehadiran).';
    recommendedAction = 'Minta konfirmasi kehadiran lebih awal untuk menjaga kuota kelas.';
    recommendedTemplateId = 'medium_priority_confirm';
  }

  return {
    memberId,
    priority,
    score,
    reason,
    recommendedAction,
    recommendedTemplateId,
    factors: {
      absentCount14d,
      presentCount14d,
      totalSchedules14d,
      hadNoResponse,
      isCurrentAbsent
    }
  };
}

/**
 * Compiles a follow-up message with member and schedule variables
 */
export function compileMessage(template, variables) {
  const { name = 'Member', className = 'Latihan Gym', formattedDate = 'Hari Ini', sessionType = 'Kelas', instructorName = 'Coach Gymnasyum' } = variables;
  return template.templateText
    .replace(/{nama}/g, name)
    .replace(/{kelas}/g, className)
    .replace(/{hari_tanggal_jam}/g, formattedDate)
    .replace(/{tipe_sesi}/g, sessionType)
    .replace(/{instruktur}/g, instructorName);
}

export default {
  FOLLOW_UP_TEMPLATES,
  evaluateMemberPriority,
  compileMessage
};
