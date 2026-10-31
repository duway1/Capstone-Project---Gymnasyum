CREATE TABLE IF NOT EXISTS members(id SERIAL PRIMARY KEY,name TEXT NOT NULL,phone VARCHAR(16) NOT NULL UNIQUE,membership_status TEXT NOT NULL DEFAULT 'active' CHECK(membership_status IN ('active','inactive')),created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS schedules(id SERIAL PRIMARY KEY,member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,class_name TEXT NOT NULL,starts_at TIMESTAMPTZ NOT NULL,attendance TEXT NOT NULL DEFAULT 'pending' CHECK(attendance IN ('pending','present','absent','rescheduled')));
CREATE TABLE IF NOT EXISTS reminders(id SERIAL PRIMARY KEY,member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,schedule_id INT NOT NULL UNIQUE REFERENCES schedules(id) ON DELETE CASCADE,due_date DATE NOT NULL,status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','opened','sent','responded','no_response')),note TEXT NOT NULL DEFAULT '',updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS communication_logs(id SERIAL PRIMARY KEY,reminder_id INT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,action TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_schedules_starts ON schedules(starts_at);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_logs_reminder ON communication_logs(reminder_id);
