import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { initDatabase, query, getClient } from './db.js';
import { evaluateMemberPriority, compileMessage, FOLLOW_UP_TEMPLATES } from './inference.js';
import { generateSyntheticData } from './datasetGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'gymnasyum_secret_jwt_key_2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const err = new Error(error.details.map((x) => x.message).join('; '));
    err.status = 400;
    throw err;
  }
  return value;
};

const id = (req, param = 'id') => {
  const val = req.params[param] ?? req.params.id ?? req.params.memberId;
  const n = Number(val);
  if (!Number.isSafeInteger(n) || n < 1) {
    const e = new Error('ID tidak valid');
    e.status = 400;
    throw e;
  }
  return n;
};

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
};

export function getJakartaDateStr(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(date));
  } catch {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// Validation Schemas
const loginSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  username: Joi.string().trim().alphanum().min(3).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('admin', 'staff').default('admin')
});

const memberSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[0-9]{9,16}$/).required(),
  email: Joi.string().trim().email().allow('').default(''),
  membership_status: Joi.string().valid('active', 'inactive').default('active'),
  notes: Joi.string().allow('').max(1000).default('')
});

const scheduleSchema = Joi.object({
  member_id: Joi.number().integer().positive().required(),
  class_name: Joi.string().trim().min(2).max(120).required(),
  session_type: Joi.string().valid('Group Class', 'Private Coaching').default('Group Class'),
  instructor_name: Joi.string().trim().max(100).default('Coach Gymnasyum'),
  starts_at: Joi.date().iso().required(),
  attendance: Joi.string().valid('pending', 'present', 'absent', 'rescheduled').default('pending')
});

const reminderSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'sent', 'responded', 'no_response', 'opened').required(),
  channel: Joi.string().valid('whatsapp', 'phone', 'in_person', 'sms', 'instagram').default('whatsapp'),
  note: Joi.string().allow('').max(1000).default('')
});

const manualLogSchema = Joi.object({
  member_id: Joi.number().integer().positive().required(),
  reminder_id: Joi.number().integer().positive().allow(null).optional(),
  channel: Joi.string().valid('whatsapp', 'phone', 'in_person', 'sms', 'instagram').default('whatsapp'),
  action: Joi.string().trim().min(2).max(100).required(),
  note: Joi.string().allow('').max(1000).default('')
});

// Reminder Base Query with Priority Inference Logic
const reminderListQuery = `
  SELECT
    r.*,
    m.name,
    m.phone,
    m.email AS member_email,
    m.membership_status,
    s.class_name,
    s.session_type,
    s.instructor_name,
    s.starts_at,
    s.attendance,
    (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') AS absent_count_14d,
    CASE
      WHEN (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 2 THEN 'high'
      WHEN s.attendance = 'absent' OR r.status = 'no_response' OR (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 1 THEN 'medium'
      ELSE 'low'
    END AS priority,
    CASE
      WHEN (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 2
        THEN 'Absen >= 2x dalam 14 hari terakhir (Risiko tinggi mangkir / berhenti latihan)'
      WHEN s.attendance = 'absent'
        THEN 'Sesi saat ini ditandai Tidak Hadir (Perlu follow-up penjadwalan ulang)'
      WHEN r.status = 'no_response'
        THEN 'Pesan pengingat sebelumnya belum ada balasan dari pelanggan'
      WHEN (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 1
        THEN 'Pernah absen 1x dalam 14 hari terakhir (Konfirmasi kuota kelas)'
      ELSE 'Presensi aktif teratur & disiplin latihan'
    END AS priority_reason
  FROM reminders r
  JOIN members m ON m.id = r.member_id
  JOIN schedules s ON s.id = r.schedule_id
`;

const getReminderById = async (remId) => {
  const result = await query(`${reminderListQuery} WHERE r.id = $1`, [remId]);
  return result.rows[0];
};

// Health check
app.get('/api/v1/health', wrap(async (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), database: db.getEngineName() });
}));

// Auth Endpoints
app.post('/api/v1/auth/login', wrap(async (req, res) => {
  const { username, password } = validate(loginSchema, req.body);
  const userRes = await query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
    [username]
  );
  const user = userRes.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login berhasil.',
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}));

app.post('/api/v1/auth/register', wrap(async (req, res) => {
  const data = validate(registerSchema, req.body);
  const check = await query(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
    [data.username, data.email]
  );
  if (check.rowCount > 0) {
    return res.status(409).json({ error: 'Username atau email sudah digunakan.' });
  }

  const hash = await bcrypt.hash(data.password, 10);
  const r = await query(
    'INSERT INTO users (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, email, role, created_at',
    [data.name, data.username, data.email, hash, data.role]
  );
  const newUser = r.rows[0];
  const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'Registrasi berhasil.',
    token,
    user: newUser
  });
}));

app.get('/api/v1/auth/me', authMiddleware, wrap(async (req, res) => {
  const r = await query('SELECT id, name, username, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
  if (!r.rowCount) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }
  res.json({ user: r.rows[0] });
}));

// Member Endpoints (Protected CRUD + Details)
app.get('/api/v1/members', authMiddleware, wrap(async (req, res) => {
  const { search, status } = req.query;
  let q = 'SELECT * FROM members';
  const args = [];
  const conditions = [];

  if (search) {
    args.push(`%${search.trim()}%`);
    conditions.push(`(name LIKE $${args.length} OR phone LIKE $${args.length} OR email LIKE $${args.length})`);
  }
  if (status && status !== 'all') {
    args.push(status);
    conditions.push(`membership_status = $${args.length}`);
  }

  if (conditions.length > 0) {
    q += ' WHERE ' + conditions.join(' AND ');
  }
  q += ' ORDER BY id DESC';

  const rows = (await query(q, args)).rows;
  res.json(rows);
}));

app.get('/api/v1/members/:id/details', authMiddleware, wrap(async (req, res) => {
  const memberId = id(req);
  const memberRes = await query('SELECT * FROM members WHERE id = $1', [memberId]);
  if (!memberRes.rowCount) {
    return res.status(404).json({ error: 'Member tidak ditemukan.' });
  }
  const member = memberRes.rows[0];

  // Attendance Statistics
  const statsRes = await query(
    `SELECT
      COUNT(*) AS total_schedules,
      COUNT(CASE WHEN attendance = 'present' THEN 1 END) AS present_count,
      COUNT(CASE WHEN attendance = 'absent' THEN 1 END) AS absent_count,
      COUNT(CASE WHEN attendance = 'rescheduled' THEN 1 END) AS rescheduled_count,
      COUNT(CASE WHEN attendance = 'pending' THEN 1 END) AS pending_count
    FROM schedules WHERE member_id = $1`,
    [memberId]
  );
  const s = statsRes.rows[0];
  const total = Number(s.total_schedules) || 0;
  const present = Number(s.present_count) || 0;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 100;

  // Schedules
  const schedulesRes = await query(
    'SELECT * FROM schedules WHERE member_id = $1 ORDER BY starts_at DESC LIMIT 20',
    [memberId]
  );

  // Communication logs
  const logsRes = await query(
    `SELECT l.*, s.class_name
     FROM communication_logs l
     LEFT JOIN reminders r ON r.id = l.reminder_id
     LEFT JOIN schedules s ON s.id = r.schedule_id
     WHERE l.member_id = $1 OR r.member_id = $1
     ORDER BY l.created_at DESC
     LIMIT 50`,
    [memberId]
  );

  res.json({
    member,
    stats: {
      totalSchedules: total,
      presentCount: present,
      absentCount: Number(s.absent_count) || 0,
      rescheduledCount: Number(s.rescheduled_count) || 0,
      pendingCount: Number(s.pending_count) || 0,
      attendanceRate
    },
    schedules: schedulesRes.rows,
    history: logsRes.rows
  });
}));

app.post('/api/v1/members', authMiddleware, wrap(async (req, res) => {
  const x = validate(memberSchema, req.body);
  const r = await query(
    'INSERT INTO members(name, phone, email, membership_status, notes) VALUES($1, $2, $3, $4, $5) RETURNING *',
    [x.name, x.phone, x.email, x.membership_status, x.notes]
  );
  res.status(201).json(r.rows[0]);
}));

app.put('/api/v1/members/:id', authMiddleware, wrap(async (req, res) => {
  const x = validate(memberSchema, req.body);
  const r = await query(
    'UPDATE members SET name = $1, phone = $2, email = $3, membership_status = $4, notes = $5 WHERE id = $6 RETURNING *',
    [x.name, x.phone, x.email, x.membership_status, x.notes, id(req)]
  );
  res.status(r.rowCount ? 200 : 404).json(r.rows[0] || { error: 'Member tidak ditemukan' });
}));

app.delete('/api/v1/members/:id', authMiddleware, wrap(async (req, res) => {
  const r = await query('DELETE FROM members WHERE id = $1', [id(req)]);
  res.status(r.rowCount ? 204 : 404).end();
}));

// Schedule Endpoints (Protected CRUD + Filters)
app.get('/api/v1/schedules', authMiddleware, wrap(async (req, res) => {
  const { date, attendance, member_id } = req.query;
  let q = `
    SELECT
      s.*,
      m.name AS member_name,
      m.phone AS member_phone,
      r.id AS reminder_id,
      r.status AS reminder_status,
      r.note AS reminder_note
    FROM schedules s
    JOIN members m ON m.id = s.member_id
    LEFT JOIN reminders r ON r.schedule_id = s.id
  `;
  const conditions = [];
  const args = [];

  if (date) {
    args.push(date);
    conditions.push(`(s.starts_at AT TIME ZONE 'Asia/Jakarta')::date = $${args.length}`);
  }
  if (attendance && attendance !== 'all') {
    args.push(attendance);
    conditions.push(`s.attendance = $${args.length}`);
  }
  if (member_id) {
    args.push(Number(member_id));
    conditions.push(`s.member_id = $${args.length}`);
  }

  if (conditions.length > 0) {
    q += ' WHERE ' + conditions.join(' AND ');
  }
  q += ' ORDER BY s.starts_at DESC';

  res.json((await query(q, args)).rows);
}));

app.post('/api/v1/schedules', authMiddleware, wrap(async (req, res) => {
  const x = validate(scheduleSchema, req.body);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const startsAtIso = x.starts_at instanceof Date ? x.starts_at.toISOString() : String(x.starts_at);
    const s = (
      await client.query(
        'INSERT INTO schedules(member_id, class_name, session_type, instructor_name, starts_at, attendance) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
        [x.member_id, x.class_name, x.session_type || 'Group Class', x.instructor_name || 'Coach Gymnasyum', startsAtIso, x.attendance]
      )
    ).rows[0];

    const dueDate = getJakartaDateStr(s.starts_at);
    await client.query(
      `INSERT INTO reminders(member_id, schedule_id, due_date, status) VALUES($1, $2, $3, 'scheduled')`,
      [s.member_id, s.id, dueDate]
    );
    await client.query('COMMIT');
    res.status(201).json(s);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

app.put('/api/v1/schedules/:id', authMiddleware, wrap(async (req, res) => {
  const x = validate(scheduleSchema, req.body);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const startsAtIso = x.starts_at instanceof Date ? x.starts_at.toISOString() : String(x.starts_at);
    const s = (
      await client.query(
        'UPDATE schedules SET member_id = $1, class_name = $2, session_type = $3, instructor_name = $4, starts_at = $5, attendance = $6 WHERE id = $7 RETURNING *',
        [x.member_id, x.class_name, x.session_type || 'Group Class', x.instructor_name || 'Coach Gymnasyum', startsAtIso, x.attendance, id(req)]
      )
    ).rows[0];
    if (!s) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule tidak ditemukan' });
    }
    const dueDate = getJakartaDateStr(s.starts_at);
    await client.query(
      `INSERT INTO reminders(member_id, schedule_id, due_date) VALUES($1, $2, $3)
       ON CONFLICT(schedule_id) DO UPDATE SET member_id = EXCLUDED.member_id, due_date = EXCLUDED.due_date, status = 'scheduled', note = '', updated_at = NOW()`,
      [s.member_id, s.id, dueDate]
    );
    await client.query('COMMIT');
    res.json(s);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

app.delete('/api/v1/schedules/:id', authMiddleware, wrap(async (req, res) => {
  const r = await query('DELETE FROM schedules WHERE id = $1', [id(req)]);
  res.status(r.rowCount ? 204 : 404).end();
}));

app.patch('/api/v1/schedules/:id/attendance', authMiddleware, wrap(async (req, res) => {
  const x = validate(
    Joi.object({ attendance: Joi.string().valid('pending', 'present', 'absent', 'rescheduled').required() }),
    req.body
  );
  const r = await query('UPDATE schedules SET attendance = $1 WHERE id = $2 RETURNING *', [x.attendance, id(req)]);
  res.status(r.rowCount ? 200 : 404).json(r.rows[0] || { error: 'Schedule tidak ditemukan' });
}));

// Reminder Endpoints (Daily Dashboard, Filtering, Status Transition)
app.get('/api/v1/reminders', authMiddleware, wrap(async (req, res) => {
  const { date, priority, status } = req.query;
  let q = reminderListQuery;
  const conditions = [];
  const args = [];

  if (date) {
    args.push(date);
    conditions.push(`r.due_date = $${args.length}`);
  }
  if (status && status !== 'all') {
    args.push(status);
    conditions.push(`r.status = $${args.length}`);
  }

  if (conditions.length > 0) {
    q += ' WHERE ' + conditions.join(' AND ');
  }

  // Filter priority if specified
  if (priority && priority !== 'all') {
    q = `SELECT * FROM (${q}) sub WHERE sub.priority = $${args.length + 1}`;
    args.push(priority);
  }

  q += ' ORDER BY r.due_date DESC, r.id DESC';
  const rows = (await query(q, args)).rows;
  res.json(rows);
}));

app.get('/api/v1/reminders/today', authMiddleware, wrap(async (_, res) => {
  const todayDateStr = getJakartaDateStr();
  const q = `
    SELECT * FROM (${reminderListQuery}) sub
    WHERE sub.due_date = $1
    ORDER BY
      CASE sub.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      sub.starts_at ASC,
      sub.id DESC
  `;
  const rows = (await query(q, [todayDateStr])).rows;
  res.json(rows);
}));

// End-to-End Status Timeline for a Reminder
app.get('/api/v1/reminders/:id/timeline', authMiddleware, wrap(async (req, res) => {
  const remId = id(req);
  const rem = await getReminderById(remId);
  if (!rem) return res.status(404).json({ error: 'Reminder tidak ditemukan' });

  const logsRes = await query(
    'SELECT * FROM communication_logs WHERE reminder_id = $1 ORDER BY created_at ASC',
    [remId]
  );

  res.json({
    reminder: rem,
    timeline: logsRes.rows
  });
}));

// Update reminder status with audit log (Alur: Scheduled -> Sent -> Responded / No Response)
app.patch('/api/v1/reminders/:id', authMiddleware, wrap(async (req, res) => {
  const x = validate(reminderSchema, req.body);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const old = (await client.query('SELECT * FROM reminders WHERE id = $1', [id(req)])).rows[0];
    if (!old) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reminder tidak ditemukan' });
    }

    const r = (
      await client.query(
        'UPDATE reminders SET status = $1, note = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [x.status, x.note, id(req)]
      )
    ).rows[0];

    // Log this status change to communication_logs
    await client.query(
      'INSERT INTO communication_logs(reminder_id, member_id, channel, action, note) VALUES($1, $2, $3, $4, $5)',
      [id(req), old.member_id, x.channel || 'whatsapp', x.status, x.note || `Status diubah menjadi: ${x.status}`]
    );

    await client.query('COMMIT');
    res.json(r);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// Messages & Follow-Up Templates Generator
app.get('/api/v1/templates', authMiddleware, (_, res) => {
  res.json(FOLLOW_UP_TEMPLATES);
});

app.get('/api/v1/reminders/:id/message', authMiddleware, wrap(async (req, res) => {
  const r = await getReminderById(id(req));
  if (!r) return res.status(404).json({ error: 'Reminder tidak ditemukan' });

  const dt = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(r.starts_at));

  // Clean phone number for WhatsApp direct link (wa.me)
  const cleanPhone = r.phone.replace(/\D/g, '').replace(/^0/, '62');

  // Compile each template with variables
  const compiledTemplates = FOLLOW_UP_TEMPLATES.map((tmpl) => {
    const text = compileMessage(tmpl, {
      name: r.name,
      className: r.class_name,
      formattedDate: dt,
      sessionType: r.session_type || 'Kelas',
      instructorName: r.instructor_name || 'Coach Gymnasyum'
    });
    return {
      ...tmpl,
      compiledText: text,
      isRecommended:
        tmpl.targetPriority === r.priority ||
        (r.status === 'no_response' && tmpl.id === 'follow_up_no_response')
    };
  });

  const defaultTemplate =
    compiledTemplates.find((t) => t.isRecommended) ||
    compiledTemplates[0];

  const directWaLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultTemplate.compiledText)}`;

  res.json({
    reminder: r,
    phone: cleanPhone,
    formattedDateTime: dt,
    defaultMessage: defaultTemplate.compiledText,
    recommendedTemplateId: defaultTemplate.id,
    directWaLink,
    templates: compiledTemplates
  });
}));

// ==========================================
// INFERENCE API ENDPOINTS (Priority Classification)
// ==========================================

app.get('/api/v1/inference/priority/:memberId', authMiddleware, wrap(async (req, res) => {
  const memberId = id(req);
  const evaluation = await evaluateMemberPriority(memberId, { query });
  res.json(evaluation);
}));

app.post('/api/v1/inference/evaluate', authMiddleware, wrap(async (req, res) => {
  const { absentCount = 0, hadNoResponse = false, isCurrentAbsent = false } = req.body;
  let priority = 'low';
  let score = 25;
  let reason = 'Presensi aktif teratur & tidak ada catatan mangkir.';
  let recommendedAction = 'Kirimkan pengingat standar persiapan latihan.';
  let recommendedTemplateId = 'low_priority_reminder';

  if (absentCount >= 2) {
    priority = 'high';
    score = 90;
    reason = `Absen ${absentCount}x dalam 14 hari terakhir (Berisiko tinggi mangkir / berhenti latihan).`;
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
    reason = 'Pesan pengingat sesi sebelumnya belum ada balasan dari pelanggan.';
    recommendedAction = 'Kirim follow-up lanjutan untuk memastikan kepastian kehadiran slot kelas.';
    recommendedTemplateId = 'follow_up_no_response';
  } else if (absentCount === 1) {
    priority = 'medium';
    score = 50;
    reason = 'Pernah absen 1x dalam 14 hari terakhir (Butuh konfirmasi kehadiran).';
    recommendedAction = 'Minta konfirmasi kehadiran lebih awal untuk menjaga kuota kelas.';
    recommendedTemplateId = 'medium_priority_confirm';
  }

  res.json({
    priority,
    score,
    reason,
    recommendedAction,
    recommendedTemplateId
  });
}));

app.get('/api/v1/inference/summary', authMiddleware, wrap(async (_, res) => {
  const todayDateStr = getJakartaDateStr();
  const list = (await query(reminderListQuery + ` WHERE r.due_date = $1`, [todayDateStr])).rows;
  const highCount = list.filter((r) => r.priority === 'high').length;
  const mediumCount = list.filter((r) => r.priority === 'medium').length;
  const lowCount = list.filter((r) => r.priority === 'low').length;

  res.json({
    totalToday: list.length,
    highPriorityCount: highCount,
    mediumPriorityCount: mediumCount,
    lowPriorityCount: lowCount,
    responseBreakdown: {
      scheduled: list.filter((r) => r.status === 'scheduled').length,
      sent: list.filter((r) => r.status === 'sent').length,
      responded: list.filter((r) => r.status === 'responded').length,
      no_response: list.filter((r) => r.status === 'no_response').length
    }
  });
}));

// ==========================================
// SYNTHETIC DATASET GENERATOR ENDPOINTS
// ==========================================

app.post('/api/v1/dataset/generate', authMiddleware, wrap(async (_, res) => {
  const result = await generateSyntheticData(false);
  res.json({ message: 'Synthetic dataset berhasil digenerate!', result });
}));

app.post('/api/v1/dataset/reset', authMiddleware, wrap(async (_, res) => {
  const result = await generateSyntheticData(true);
  res.json({ message: 'Database direset dan synthetic dataset baru berhasil diinisialisasi!', result });
}));

// Communication Logs (Riwayat Komunikasi) Endpoints
app.get('/api/v1/history', authMiddleware, wrap(async (req, res) => {
  const { member_id, action, channel, search } = req.query;
  let q = `
    SELECT
      l.*,
      m.name,
      m.phone,
      s.class_name,
      s.session_type,
      s.starts_at,
      r.status AS reminder_status,
      r.due_date
    FROM communication_logs l
    LEFT JOIN reminders r ON r.id = l.reminder_id
    LEFT JOIN members m ON m.id = COALESCE(l.member_id, r.member_id)
    LEFT JOIN schedules s ON s.id = r.schedule_id
  `;
  const conditions = [];
  const args = [];

  if (member_id) {
    args.push(Number(member_id));
    conditions.push(`(l.member_id = $${args.length} OR r.member_id = $${args.length})`);
  }
  if (action && action !== 'all') {
    args.push(action);
    conditions.push(`l.action = $${args.length}`);
  }
  if (channel && channel !== 'all') {
    args.push(channel);
    conditions.push(`l.channel = $${args.length}`);
  }
  if (search) {
    args.push(`%${search.trim()}%`);
    conditions.push(`(m.name LIKE $${args.length} OR l.note LIKE $${args.length} OR s.class_name LIKE $${args.length})`);
  }

  if (conditions.length > 0) {
    q += ' WHERE ' + conditions.join(' AND ');
  }
  q += ' ORDER BY l.created_at DESC LIMIT 500';

  const rows = (await query(q, args)).rows;
  res.json(rows);
}));

app.post('/api/v1/history', authMiddleware, wrap(async (req, res) => {
  const data = validate(manualLogSchema, req.body);
  const r = await query(
    'INSERT INTO communication_logs(member_id, reminder_id, channel, action, note) VALUES($1, $2, $3, $4, $5) RETURNING *',
    [data.member_id, data.reminder_id || null, data.channel || 'whatsapp', data.action, data.note]
  );
  res.status(201).json(r.rows[0]);
}));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === '23505' || err.message?.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'Data sudah ada (duplikasi nomor telepon, username, atau email).' });
  }
  if (err.code === '23503' || err.message?.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({ error: 'Referensi data pelanggan atau jadwal tidak valid.' });
  }
  if (err.code === '23514' || err.message?.includes('CHECK constraint failed')) {
    return res.status(400).json({ error: 'Format data tidak sesuai batasan.' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Terjadi kesalahan pada server backend.' });
});

// Seed default user
const seedDefaultUser = async () => {
  try {
    const existing = await query('SELECT id FROM users LIMIT 1');
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        ['Administrator', 'admin', 'admin@gymnasyum.com', hash, 'admin']
      );
      console.log('Seeded default admin account: admin / admin123');
    }
  } catch (err) {
    console.error('Error seeding default user:', err);
  }
};

const PORT = process.env.PORT || 3001;

// Initialize Database & Start Server
initDatabase().then(async () => {
  await seedDefaultUser();
  app.listen(PORT, () => {
    console.log(`🚀 Gymnasyum API ready on port ${PORT} [DB: ${db.getEngineName()}]`);
  });
}).catch((err) => {
  console.error('Fatal initialization error:', err);
});
