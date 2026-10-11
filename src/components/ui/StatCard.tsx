import type { ReactNode } from 'react';
import { Card } from './Card';
import { formatNumber } from '../../utils/format';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'teal' | 'blue' | 'amber' | 'rose' | 'neutral' | 'green' | 'gold';
  className?: string;
}

export function StatCard({ label, value, icon, tone = 'teal', className = '' }: StatCardProps) {
  const language = document.documentElement.lang === 'en' ? 'en' : 'ar';
  const displayValue = typeof value === 'number'
    ? formatNumber(value, language)
    : /^\d+(?:\.\d+)?$/.test(value)
      ? formatNumber(Number(value), language)
      : value;

  return (
    <Card className={`ui-stat-card ui-stat-card--${tone} ${className}`.trim()}>
      <span className="ui-stat-card__icon">{icon}</span>
      <div><strong>{displayValue}</strong><span>{label}</span></div>
    </Card>
  );
}
