export default function MembersPage({
  members,
  form,
  setForm,
  edit,
  setEdit,
  onSave,
  onRemove
}) {
  return (
    <>
      <section>
        <h3>{edit ? 'Edit Member' : 'Add New Member'}</h3>
        <form onSubmit={onSave}>
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Phone: 628123456789"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <select
            value={form.membership_status}
            onChange={(e) =>
              setForm({ ...form, membership_status: e.target.value })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="primary">{edit ? 'Update' : 'Add Member'}</button>
          {edit && (
            <button
              type="button"
              onClick={() => {
                setEdit(null);
                setForm({ name: '', phone: '', membership_status: 'active' });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section>
        <h3>Member Directory</h3>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length ? (
                members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.phone}</td>
                    <td>{m.membership_status}</td>
                    <td>
                      <button
                        onClick={() => {
                          setEdit(m.id);
                          setForm({
                            name: m.name,
                            phone: m.phone,
                            membership_status: m.membership_status
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button onClick={() => onRemove(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
