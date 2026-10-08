import type { ReactNode } from 'react';
import { Input } from '../ui/Input';

interface FilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}

export function FilterBar({ value, onChange, placeholder, children }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {children}
    </div>
  );
}
