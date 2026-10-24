import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Switch.css';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}

export function Switch({ checked, onChange, label, description, className = '', ...props }: SwitchProps) {
  return (
    <div className={`ui-switch-row ${className}`.trim()}>
      <span className="ui-switch-row__copy">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-label={typeof label === 'string' ? label : undefined}
        aria-checked={checked}
        className={`ui-switch${checked ? ' ui-switch--checked' : ''}`}
        onClick={() => onChange(!checked)}
        {...props}
      >
        <span className="ui-switch__thumb" />
      </button>
    </div>
  );
}
