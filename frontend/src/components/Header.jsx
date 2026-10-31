export default function Header({ page }) {
  return (
    <header>
      <div>
        <small>GYMNASYUM / {page.toUpperCase()}</small>
        <h2>{page === 'Overview' ? 'Dashboard Overview' : page}</h2>
        <p>Manage members, classes, and follow-ups in one place.</p>
      </div>
      <span className="avatar">AD</span>
    </header>
  );
}
