export function NotFoundPage() {
  return (
    <div className="page notfound-page">
      <div className="notfound-card">
        <p className="notfound-card__eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="text-muted">
          The page you requested does not exist or has moved.
        </p>
      </div>
    </div>
  );
}
