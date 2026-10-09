import type { ReactNode } from 'react';
import './PageHero.css';

interface PageHeroProps {
  title: string;
  eyebrow?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHero({ title, eyebrow, description, children, className = '' }: PageHeroProps) {
  return (
    <section className={`page-hero ${className}`.trim()}>
      <div>
        {eyebrow && <span className="page-hero__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}
