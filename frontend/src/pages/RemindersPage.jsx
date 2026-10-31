import ReminderTable from '../components/ReminderTable';

export default function RemindersPage({ reminders, whatsapp, update }) {
  return (
    <section>
      <h3>Today's Reminder Queue</h3>
      <ReminderTable rows={reminders} whatsapp={whatsapp} update={update} />
    </section>
  );
}
