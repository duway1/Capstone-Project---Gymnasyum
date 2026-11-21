import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/gymnasyum';
const FORCE_SQLITE = process.env.DB_CLIENT === 'sqlite';

let dbEngine = 'sqlite'; // 'postgres' | 'sqlite'
let pgPool = null;
let sqliteDb = null;

// Initialize Database connection
export async function initDatabase() {
  if (!FORCE_SQLITE) {
    try {
      const testPool = new pg.Pool({
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 1500
      });
      // Test connectivity
      await testPool.query('SELECT 1');
      pgPool = testPool;
      dbEngine = 'postgres';
      console.log('✅ [Database] Berhasil terhubung ke PostgreSQL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
      await runPostgresMigrations();
      return;
    } catch (err) {
      console.warn('⚠️ [Database] PostgreSQL tidak dapat dihubungi (' + err.message + ').');
      console.log('💡 [Database] Menggunakan database SQLite lokal.');
    }
  }

  // Fallback to SQLite
  dbEngine = 'sqlite';
  const sqlitePath = path.resolve(__dirname, '../gymnasyum.sqlite');
  sqliteDb = new DatabaseSync(sqlitePath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  console.log('✅ [Database] SQLite aktif di:', sqlitePath);
  runSqliteMigrations();
}

async function runPostgresMigrations() {
  const schemaPath = path.resolve(__dirname, '../schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pgPool.query(sql);
  }
  // Auto-migrate new columns for existing tables in PostgreSQL
  try {
    await pgPool.query(`
      ALTER TABLE schedules ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'Group Class';
      ALTER TABLE schedules ADD COLUMN IF NOT EXISTS instructor_name TEXT NOT NULL DEFAULT 'Coach Gymnasyum';
      ALTER TABLE reminders ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
      ALTER TABLE reminders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('✅ [Database] PostgreSQL migrations auto-applied: session_type & instructor_name.');
  } catch (err) {
    console.error('Migration notice:', err.message);
  }
}

function runSqliteMigrations() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT DEFAULT '',
      membership_status TEXT NOT NULL DEFAULT 'active' CHECK(membership_status IN ('active','inactive')),
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      class_name TEXT NOT NULL,
      session_type TEXT NOT NULL DEFAULT 'Group Class',
      instructor_name TEXT NOT NULL DEFAULT 'Coach Gymnasyum',
      starts_at TEXT NOT NULL,
      attendance TEXT NOT NULL DEFAULT 'pending' CHECK(attendance IN ('pending','present','absent','rescheduled'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      schedule_id INTEGER NOT NULL UNIQUE REFERENCES schedules(id) ON DELETE CASCADE,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','opened','sent','responded','no_response')),
      note TEXT NOT NULL DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS communication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_id INTEGER REFERENCES reminders(id) ON DELETE CASCADE,
      member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
      channel TEXT NOT NULL DEFAULT 'whatsapp',
      action TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_schedules_starts ON schedules(starts_at);
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);
    CREATE INDEX IF NOT EXISTS idx_logs_reminder ON communication_logs(reminder_id);
    CREATE INDEX IF NOT EXISTS idx_logs_member ON communication_logs(member_id);
  `);
}

/**
 * Normalizes SQL queries and parameters for SQLite compatibility
 */
function translateQueryForSqlite(sql, params = []) {
  let transformed = sql;

  // Replace PostgreSQL date/time functions
  transformed = transformed.replace(/NOW\(\) - INTERVAL '(\d+) days'/gi, "datetime('now', '-$1 days')");
  transformed = transformed.replace(/NOW\(\)/gi, "datetime('now')");
  transformed = transformed.replace(/\(NOW\(\) AT TIME ZONE 'Asia\/Jakarta'\)::date/gi, "date('now')");
  transformed = transformed.replace(/\(s\.starts_at AT TIME ZONE 'Asia\/Jakarta'\)::date/gi, "substr(s.starts_at, 1, 10)");
  transformed = transformed.replace(/\(\$3::timestamptz AT TIME ZONE 'Asia\/Jakarta'\)::date/gi, "substr($3, 1, 10)");
  transformed = transformed.replace(/ILIKE/g, 'LIKE');
  transformed = transformed.replace(/::date/gi, '');
  transformed = transformed.replace(/::timestamptz/gi, '');

  // Convert $1, $2, ... placeholders to ? for SQLite
  // Map parameters in order of their appearance if placeholders are used
  const finalParams = [];
  transformed = transformed.replace(/\$(\d+)/g, (match, num) => {
    const idx = parseInt(num, 10) - 1;
    finalParams.push(params[idx]);
    return '?';
  });

  // If no $ placeholders were found, use params as is
  const actualParams = finalParams.length > 0 ? finalParams : params;

  // Clean SQLite incompatible clauses
  transformed = transformed.replace(/FOR UPDATE/gi, '');

  // Normalize parameters for SQLite (Date objects to ISO string, undefined to null, boolean to 0/1)
  const sanitizedParams = actualParams.map((p) => {
    if (p instanceof Date) {
      return p.toISOString();
    }
    if (p === undefined) {
      return null;
    }
    if (typeof p === 'boolean') {
      return p ? 1 : 0;
    }
    return p;
  });

  return { sql: transformed, params: sanitizedParams };
}

/**
 * Universal query runner
 */
export async function query(sql, params = []) {
  if (dbEngine === 'postgres' && pgPool) {
    return await pgPool.query(sql, params);
  }

  // SQLite execution
  const { sql: sqliteSql, params: sqliteParams } = translateQueryForSqlite(sql, params);
  const trimmed = sqliteSql.trim();
  const isSelect = /^SELECT/i.test(trimmed);

  try {
    const stmt = sqliteDb.prepare(sqliteSql);

    if (isSelect) {
      const rows = stmt.all(...sqliteParams);
      return { rows, rowCount: rows.length };
    }

    // Insert / Update / Delete
    if (/RETURNING/i.test(sqliteSql)) {
      const rows = stmt.all(...sqliteParams);
      return { rows, rowCount: rows.length };
    }

    const info = stmt.run(...sqliteParams);
    return {
      rows: [],
      rowCount: Number(info.changes || 0),
      lastInsertRowid: info.lastInsertRowid
    };
  } catch (err) {
    console.error('SQLite execution error:', err.message, '\nSQL:', sqliteSql, '\nParams:', sqliteParams);
    throw err;
  }
}

/**
 * Client connection wrapper for transactions
 */
export async function getClient() {
  if (dbEngine === 'postgres' && pgPool) {
    const client = await pgPool.connect();
    return {
      query: (text, params) => client.query(text, params),
      release: () => client.release()
    };
  }

  // SQLite transaction pseudo-client
  return {
    query: async (text, params) => {
      const trimmed = text.trim().toUpperCase();
      if (trimmed === 'BEGIN') {
        sqliteDb.exec('BEGIN TRANSACTION;');
        return { rowCount: 0, rows: [] };
      }
      if (trimmed === 'COMMIT') {
        sqliteDb.exec('COMMIT;');
        return { rowCount: 0, rows: [] };
      }
      if (trimmed === 'ROLLBACK') {
        sqliteDb.exec('ROLLBACK;');
        return { rowCount: 0, rows: [] };
      }
      return query(text, params);
    },
    release: () => {}
  };
}

export function getEngineName() {
  return dbEngine;
}

export default {
  initDatabase,
  query,
  getClient,
  getEngineName
};
