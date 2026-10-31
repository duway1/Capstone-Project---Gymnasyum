export default function HistoryPage({ history }) {
  return (
    <section>
      <h3>Reminder Status History (Today)</h3>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Member</th>
              <th>Class</th>
              <th>Action</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {history.length ? (
              history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleString('id-ID')}</td>
                  <td>{h.name}</td>
                  <td>{h.class_name}</td>
                  <td>{h.action}</td>
                  <td>{h.note}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No history records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
