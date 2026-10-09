import { useEffect } from 'react';
import type { ReactNode } from 'react';
import './Drawer.css';

interface DrawerProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  closeLabel?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  side?: 'start' | 'end';
  closeLabel?: string;
  className?: string;
  footer?: ReactNode;
}

export function Drawer({ open, title, eyebrow, closeLabel = 'Close', onClose, footer, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer__backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drawer__header">
          <div>
            {eyebrow && <span className="drawer__eyebrow">{eyebrow}</span>}
            <h2 className="drawer__title">{title}</h2>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label={closeLabel}>×</button>
        </header>
        <div className="drawer__content">{children}</div>
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </aside>
    </div>
  );
}