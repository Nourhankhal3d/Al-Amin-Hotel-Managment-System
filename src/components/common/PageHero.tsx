import type { ReactNode } from 'react';

interface PageHeroProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHero({ title, description, children }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {children}
    </section>
  );
}
