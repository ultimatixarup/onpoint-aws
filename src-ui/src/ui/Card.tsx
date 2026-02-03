import { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{ title?: string }>;

export function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      {title && <h2 className="card__title">{title}</h2>}
      <div className="card__body">{children}</div>
    </section>
  );
}
