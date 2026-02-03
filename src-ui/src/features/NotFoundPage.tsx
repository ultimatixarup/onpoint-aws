import { PageHeader } from "../ui/PageHeader";

export function NotFoundPage() {
  return (
    <div className="page">
      <PageHeader title="Page not found" />
      <p>The page you requested does not exist.</p>
    </div>
  );
}
