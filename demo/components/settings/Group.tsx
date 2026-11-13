import type { ReactNode } from 'react';

/** A titled group of settings in a section. */
export function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="demo-group">
      <h3>{title}</h3>
      {hint && <p className="demo-hint">{hint}</p>}
      {children}
    </section>
  );
}
