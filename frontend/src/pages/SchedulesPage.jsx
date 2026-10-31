export default function SchedulesPage({
  schedules,
  members,
  scheduleForm,
  setScheduleForm,
  scheduleEdit,
  setScheduleEdit,
  onSaveSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onAttendanceChange
}) {
  return (
    <>
      <section>
        <h3>{scheduleEdit ? 'Edit Schedule' : 'Create Schedule'}</h3>
        <form onSubmit={onSaveSchedule}>
          <select
            required
            value={scheduleForm.member_id}
            onChange={(e) =>
              setScheduleForm({ ...scheduleForm, member_id: e.target.value })
            }
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Class name"
            required
            value={scheduleForm.class_name}
            onChange={(e) =>
              setScheduleForm({ ...scheduleForm, class_name: e.target.value })
            }
          />
          <input
            type="datetime-local"
            required
            value={scheduleForm.starts_at}
            onChange={(e) =>
              setScheduleForm({ ...scheduleForm, starts_at: e.target.value })
            }
          />
          <button className="primary">
            {scheduleEdit ? 'Save Changes' : 'Add Schedule'}
          </button>
          {scheduleEdit && (
            <button
              type="button"
              onClick={() => {
                setScheduleEdit(null);
                setScheduleForm({
                  member_id: '',
                  class_name: '',
                  starts_at: '',
                  attendance: 'pending'
                });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section>
        <h3>Class Schedule</h3>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Class</th>
                <th>Time</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length ? (
                schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{s.member_name}</td>
                    <td>{s.class_name}</td>
                    <td>{new Date(s.starts_at).toLocaleString('id-ID')}</td>
                    <td>
                      <select
                        value={s.attendance}
                        onChange={(e) => onAttendanceChange(s.id, e.target.value)}
                      >
                        {['pending', 'present', 'absent', 'rescheduled'].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => onEditSchedule(s)}>Edit</button>
                      <button onClick={() => onDeleteSchedule(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No schedules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
