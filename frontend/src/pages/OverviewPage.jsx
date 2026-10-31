import ReminderTable from '../components/ReminderTable';

export default function OverviewPage({ members, schedules, reminders, whatsapp, update }) {
  const pendingCount = reminders.filter(
    (r) => r.status === 'scheduled' || r.status === 'no_response'
  ).length;

  const stats = [
    ['Total Members', members.length],
    ['Scheduled Classes', schedules.length],
    ['Today Reminders', reminders.length],
    ['Pending Follow-ups', pendingCount]
  ];

  return (
    <>
      <div className="stats">
        {stats.map(([label, val]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{val}</strong>
          </article>
        ))}
      </div>
      <section>
        <h3>Today's Follow-ups</h3>
        <ReminderTable rows={reminders} whatsapp={whatsapp} update={update} />
      </section>
    </>
  );
}
