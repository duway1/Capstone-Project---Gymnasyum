import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pg from 'pg';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'gymnasyum_secret_jwt_key_2026';

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

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

const id = (req) => {
  const n = Number(req.params.id);
  if (!Number.isSafeInteger(n) || n < 1) {
    const e = new Error('Invalid ID');
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

// Schemas
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
  phone: Joi.string().pattern(/^\+?[0-9]{9,15}$/).required(),
  membership_status: Joi.string().valid('active', 'inactive').default('active')
});

const scheduleSchema = Joi.object({
  member_id: Joi.number().integer().positive().required(),
  class_name: Joi.string().trim().min(2).max(120).required(),
  starts_at: Joi.date().iso().required(),
  attendance: Joi.string().valid('pending', 'present', 'absent', 'rescheduled').default('pending')
});

const reminderSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'opened', 'sent', 'responded', 'no_response').required(),
  note: Joi.string().allow('').max(1000).default('')
});

const getReminder = async (id) =>
  (
    await db.query(
      `SELECT r.*, m.name, m.phone, s.class_name, s.starts_at, s.attendance,
        (CASE
          WHEN (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 2 THEN 'high'
          WHEN s.attendance = 'absent' OR r.status = 'no_response' OR (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 1 THEN 'medium'
          ELSE 'low'
        END) priority
      FROM reminders r
      JOIN members m ON m.id = r.member_id
      JOIN schedules s ON s.id = r.schedule_id
      WHERE r.id = $1`,
      [id]
    )
  ).rows[0];

// Health check
app.get('/api/v1/health', wrap(async (_, res) => {
  await db.query('SELECT 1');
  res.json({ ok: true });
}));

// Auth endpoints
app.post('/api/v1/auth/login', wrap(async (req, res) => {
  const { username, password } = validate(loginSchema, req.body);
  const userRes = await db.query(
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
  const check = await db.query(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
    [data.username, data.email]
  );
  if (check.rowCount > 0) {
    return res.status(409).json({ error: 'Username atau email sudah digunakan.' });
  }

  const hash = await bcrypt.hash(data.password, 10);
  const r = await db.query(
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
  const r = await db.query('SELECT id, name, username, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
  if (!r.rowCount) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }
  res.json({ user: r.rows[0] });
}));

// Member endpoints (protected)
app.get('/api/v1/members', authMiddleware, wrap(async (_, res) =>
  res.json((await db.query('SELECT * FROM members ORDER BY id DESC')).rows)
));

app.post('/api/v1/members', authMiddleware, wrap(async (req, res) => {
  const x = validate(memberSchema, req.body);
  const r = await db.query('INSERT INTO members(name, phone, membership_status) VALUES($1, $2, $3) RETURNING *', [
    x.name,
    x.phone,
    x.membership_status
  ]);
  res.status(201).json(r.rows[0]);
}));

app.put('/api/v1/members/:id', authMiddleware, wrap(async (req, res) => {
  const x = validate(memberSchema, req.body);
  const r = await db.query(
    'UPDATE members SET name = $1, phone = $2, membership_status = $3 WHERE id = $4 RETURNING *',
    [x.name, x.phone, x.membership_status, id(req)]
  );
  res.status(r.rowCount ? 200 : 404).json(r.rows[0] || { error: 'Member not found' });
}));

app.delete('/api/v1/members/:id', authMiddleware, wrap(async (req, res) => {
  const r = await db.query('DELETE FROM members WHERE id = $1', [id(req)]);
  res.status(r.rowCount ? 204 : 404).end();
}));

// Schedule endpoints (protected)
app.get('/api/v1/schedules', authMiddleware, wrap(async (_, res) =>
  res.json((await db.query('SELECT s.*, m.name AS member_name FROM schedules s JOIN members m ON m.id = s.member_id ORDER BY s.starts_at DESC')).rows)
));

app.post('/api/v1/schedules', authMiddleware, wrap(async (req, res) => {
  const x = validate(scheduleSchema, req.body);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const s = (
      await client.query(
        'INSERT INTO schedules(member_id, class_name, starts_at, attendance) VALUES($1, $2, $3, $4) RETURNING *',
        [x.member_id, x.class_name, x.starts_at, x.attendance]
      )
    ).rows[0];
    await client.query(
      `INSERT INTO reminders(member_id, schedule_id, due_date) VALUES($1, $2, ($3::timestamptz AT TIME ZONE 'Asia/Jakarta')::date)`,
      [s.member_id, s.id, s.starts_at]
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
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const s = (
      await client.query(
        'UPDATE schedules SET member_id = $1, class_name = $2, starts_at = $3, attendance = $4 WHERE id = $5 RETURNING *',
        [x.member_id, x.class_name, x.starts_at, x.attendance, id(req)]
      )
    ).rows[0];
    if (!s) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }
    await client.query(
      `INSERT INTO reminders(member_id, schedule_id, due_date) VALUES($1, $2, ($3::timestamptz AT TIME ZONE 'Asia/Jakarta')::date)
       ON CONFLICT(schedule_id) DO UPDATE SET member_id = EXCLUDED.member_id, due_date = EXCLUDED.due_date, status = 'scheduled', note = '', updated_at = NOW()`,
      [s.member_id, s.id, s.starts_at]
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
  const r = await db.query('DELETE FROM schedules WHERE id = $1', [id(req)]);
  res.status(r.rowCount ? 204 : 404).end();
}));

app.patch('/api/v1/schedules/:id/attendance', authMiddleware, wrap(async (req, res) => {
  const x = validate(
    Joi.object({ attendance: Joi.string().valid('pending', 'present', 'absent', 'rescheduled').required() }),
    req.body
  );
  const r = await db.query('UPDATE schedules SET attendance = $1 WHERE id = $2 RETURNING *', [x.attendance, id(req)]);
  res.status(r.rowCount ? 200 : 404).json(r.rows[0] || { error: 'Not found' });
}));

// Reminder endpoints (protected)
const reminderList = `SELECT r.*, m.name, m.phone, s.class_name, s.starts_at, s.attendance,
  CASE
    WHEN (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 2 THEN 'high'
    WHEN s.attendance = 'absent' OR r.status = 'no_response' OR (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 1 THEN 'medium'
    ELSE 'low'
  END priority
FROM reminders r
JOIN members m ON m.id = r.member_id
JOIN schedules s ON s.id = r.schedule_id`;

app.get('/api/v1/reminders', authMiddleware, wrap(async (req, res) => {
  const date = req.query.date;
  let q = reminderList;
  const args = [];
  if (date) {
    const x = validate(Joi.object({ date: Joi.date().iso().required() }), { date });
    q += ' WHERE r.due_date = $1';
    args.push(x.date);
  }
  q += ' ORDER BY r.due_date DESC, r.id DESC';
  res.json((await db.query(q, args)).rows);
}));

app.get('/api/v1/reminders/today', authMiddleware, wrap(async (_, res) =>
  res.json(
    (
      await db.query(
        reminderList +
          ` WHERE r.due_date = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
            ORDER BY CASE WHEN (SELECT COUNT(*) FROM schedules a WHERE a.member_id = m.id AND a.attendance = 'absent' AND a.starts_at >= NOW() - INTERVAL '14 days') >= 2 THEN 0 ELSE 1 END, r.id DESC`
      )
    ).rows
  )
));

app.patch('/api/v1/reminders/:id', authMiddleware, wrap(async (req, res) => {
  const x = validate(reminderSchema, req.body);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const old = (await client.query('SELECT * FROM reminders WHERE id = $1 FOR UPDATE', [id(req)])).rows[0];
    if (!old) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reminder not found' });
    }
    const allowed = {
      scheduled: ['opened', 'sent', 'responded', 'no_response'],
      opened: ['sent', 'scheduled', 'responded', 'no_response'],
      sent: ['responded', 'no_response', 'scheduled', 'opened'],
      no_response: ['responded', 'sent', 'scheduled', 'opened'],
      responded: ['sent', 'no_response', 'scheduled', 'opened']
    };
    if (x.status !== old.status && !allowed[old.status]?.includes(x.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Invalid transition: ${old.status} → ${x.status}` });
    }
    const r = (
      await client.query('UPDATE reminders SET status = $1, note = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [
        x.status,
        x.note,
        id(req)
      ])
    ).rows[0];
    await client.query('INSERT INTO communication_logs(reminder_id, action, note) VALUES($1, $2, $3)', [
      id(req),
      x.status,
      x.note
    ]);
    await client.query('COMMIT');
    res.json(r);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

app.get('/api/v1/history', authMiddleware, wrap(async (_, res) =>
  res.json(
    (
      await db.query(
        `SELECT l.*, m.name, s.class_name
         FROM communication_logs l
         JOIN reminders r ON r.id = l.reminder_id
         JOIN members m ON m.id = r.member_id
         JOIN schedules s ON s.id = r.schedule_id
         ORDER BY l.created_at DESC
         LIMIT 500`
      )
    ).rows
  )
));

app.get('/api/v1/reminders/:id/message', authMiddleware, wrap(async (req, res) => {
  const r = await getReminder(id(req));
  if (!r) return res.status(404).json({ error: 'Not found' });
  const dt = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(r.starts_at));
  const message =
    r.status === 'no_response'
      ? `Halo ${r.name}, kami dari Gymnasyum ingin menindaklanjuti jadwal ${r.class_name}. Apakah ada yang bisa kami bantu?`
      : `Halo ${r.name}, pengingat dari Gymnasyum: kelas ${r.class_name} dijadwalkan ${dt} WIB. Mohon konfirmasi kehadiran Anda. Terima kasih!`;
  res.json({ message, phone: r.phone.replace(/\D/g, '').replace(/^0/, '62') });
}));

// Error handling
app.use((err, req, res, next) => {
  if (err.code === '23505') return res.status(409).json({ error: 'Data already exists (duplicate key)' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referenced member does not exist' });
  if (err.code === '23514') return res.status(400).json({ error: 'Invalid value' });
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
});

// Seed default user and listen
const seedDefaultUser = async () => {
  try {
    const existing = await db.query('SELECT id FROM users LIMIT 1');
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.query(
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
app.listen(PORT, async () => {
  console.log(`Gymnasyum API ready on port ${PORT}`);
  await seedDefaultUser();
});
