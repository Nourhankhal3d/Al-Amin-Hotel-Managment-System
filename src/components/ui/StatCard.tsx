import type { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'teal' | 'blue' | 'amber' | 'rose';
}

export function StatCard({ label, value, icon, tone = 'teal' }: StatCardProps) {
  return (
    <Card className={`ui-stat-card ui-stat-card--${tone}`}>
      <span className="ui-stat-card__icon">{icon}</span>
      <div><strong>{value}</strong><span>{label}</span></div>
    </Card>
  );
}
