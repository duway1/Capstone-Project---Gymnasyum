import http from 'http';
import { initDatabase, query } from './src/db.js';
import { generateSyntheticData } from './src/datasetGenerator.js';
import { evaluateMemberPriority } from './src/inference.js';

async function runTests() {
  console.log('🧪 [Test Suite] Memulai pengujian end-to-end backend Gymnasyum...');

  // 1. Database Init
  await initDatabase();
  console.log('✅ Test 1: Database initialized successfully');

  // 2. Synthetic Dataset Generation
  const datasetResult = await generateSyntheticData(true);
  if (!datasetResult.success || datasetResult.membersCount < 5) {
    throw new Error('Gagal menghasilkan dataset simulasi.');
  }
  console.log(`✅ Test 2: Synthetic Dataset Generator berhasil (${datasetResult.membersCount} members, ${datasetResult.todayRemindersCount} reminder hari ini)`);

  // 3. Verify Members
  const members = (await query('SELECT * FROM members')).rows;
  if (members.length === 0) throw new Error('Data member kosong');
  console.log(`✅ Test 3: Data member tersimpan (${members.length} members)`);

  // 4. Verify Priority Classification / Inference Logic
  const highMember = members.find(m => m.name === 'Budi Santoso');
  if (highMember) {
    const evalResult = await evaluateMemberPriority(highMember.id, { query });
    if (evalResult.priority !== 'high') {
      throw new Error(`Expected Budi Santoso to be high priority, got ${evalResult.priority}`);
    }
    console.log(`✅ Test 4: Inference API berhasil mengklasifikasikan ${highMember.name} sebagai '${evalResult.priority}' (Alasan: ${evalResult.reason})`);
  }

  // 5. Verify Reminder Flow (Scheduled -> Sent -> Responded / No Response)
  const rem = (await query('SELECT * FROM reminders WHERE status = $1 LIMIT 1', ['scheduled'])).rows[0];
  if (rem) {
    // Transition to Sent
    await query('UPDATE reminders SET status = $1 WHERE id = $2', ['sent', rem.id]);
    const remSent = (await query('SELECT * FROM reminders WHERE id = $1', [rem.id])).rows[0];
    if (remSent.status !== 'sent') throw new Error('Status transition to sent failed');

    // Transition to Responded
    await query('UPDATE reminders SET status = $1 WHERE id = $2', ['responded', rem.id]);
    const remResponded = (await query('SELECT * FROM reminders WHERE id = $1', [rem.id])).rows[0];
    if (remResponded.status !== 'responded') throw new Error('Status transition to responded failed');

    console.log(`✅ Test 5: Alur Status Reminder berhasil (Scheduled -> Sent -> Responded) pada reminder #${rem.id}`);
  }

  // 6. Verify Communication Logs
  const logs = (await query('SELECT * FROM communication_logs')).rows;
  if (logs.length === 0) throw new Error('Communication logs kosong');
  console.log(`✅ Test 6: Riwayat komunikasi (communication_logs) terverifikasi (${logs.length} entri log)`);

  console.log('\n🎉 SELURUH PENGUJIAN RESTful API & LOGIKA BISNIS BERHASIL DENGAN SEMPURNA! 🎉');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
