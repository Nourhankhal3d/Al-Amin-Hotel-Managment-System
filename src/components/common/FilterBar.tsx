import type { ReactNode } from 'react';
import { SearchBar } from './SearchBar';
import './FilterBar.css';

interface FilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
  className?: string;
}

export function FilterBar({ value, onChange, placeholder, children, className = '' }: FilterBarProps) {
  return (
    <div className={`filter-bar ${className}`.trim()}>
      <SearchBar value={value} onChange={onChange} placeholder={placeholder} />
      {children}
    </div>
  );
}
