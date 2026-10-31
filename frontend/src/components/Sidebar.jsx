const NAV_ITEMS = ['Overview', 'Members', 'Schedules', 'Reminders', 'History'];

export default function Sidebar({ page, setPage }) {
  return (
    <aside>
      <h1>◆ Gymnasyum</h1>
      <p>CRM ADMIN SYSTEM</p>
      {NAV_ITEMS.map((x) => (
        <button
          key={x}
          className={page === x ? 'active' : ''}
          onClick={() => setPage(x)}
        >
          {x}
        </button>
      ))}
    </aside>
  );
}
