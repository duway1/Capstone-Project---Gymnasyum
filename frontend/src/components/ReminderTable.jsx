export default function ReminderTable({ rows, whatsapp, update }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Class</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.class_name}</td>
                <td>
                  <span className={`pill ${r.priority}`}>{r.priority}</span>
                </td>
                <td>
                  <span className="pill">{r.status}</span>
                </td>
                <td>
                  <button onClick={() => whatsapp(r)}>WhatsApp</button>
                  <button
                    disabled={!['scheduled', 'opened', 'no_response', 'responded', 'sent'].includes(r.status)}
                    onClick={() => update(r.id, 'sent')}
                  >
                    Mark Sent
                  </button>
                  <button onClick={() => update(r.id, 'responded')}>Responded</button>
                  <button onClick={() => update(r.id, 'no_response')}>No Response</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No reminders for today.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
