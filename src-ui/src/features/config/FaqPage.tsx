import { Card } from "../../ui/Card";

const faqItems = [
  {
    question: "Why do I see empty settings values?",
    answer:
      "Settings are layered by scope. If no tenant or fleet override exists, the effective map may be empty until defaults are defined.",
  },
  {
    question: "Who can change settings?",
    answer:
      "Platform admins can change all scopes. Tenant admins can change tenant and fleet scopes inside their tenant. Fleet managers and read-only roles can view only.",
  },
  {
    question: "When do notification changes apply?",
    answer:
      "Notification settings are persisted immediately and are picked up by backend reads on the next request.",
  },
  {
    question: "How do I troubleshoot missing data in Telemetry Events?",
    answer:
      "Verify tenant and fleet selectors, then clear filters. If no records appear, confirm ingest pipeline health and trip summary availability.",
  },
];

export function FaqPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Help Center</p>
        <h1>FAQ</h1>
        <p className="ops-placeholder__subtitle">
          Quick answers for fleet managers and operations teams.
        </p>
      </section>

      <Card title="Common Questions">
        <div className="stack">
          {faqItems.map((item) => (
            <details key={item.question} className="section">
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                {item.question}
              </summary>
              <p className="text-muted" style={{ marginTop: "8px" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
