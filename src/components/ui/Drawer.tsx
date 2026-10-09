import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import './Drawer.css';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  side?: 'start' | 'end';
  closeLabel?: string;
  className?: string;
  footer?: ReactNode;
}

export function Drawer({ open, title, onClose, children, side = 'start', closeLabel = 'Close', className = '', footer }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('button, input, textarea, [tabindex]:not([tabindex="-1"])')?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!panelRef.current?.contains(event.target as Node)) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="ui-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={panelRef} className={`ui-drawer ui-drawer--${side} ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="ui-drawer__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="ui-icon-button" onClick={onClose} aria-label={closeLabel}><X aria-hidden="true" /></button>
        </header>
        <div className="ui-drawer__content">{children}</div>
        {footer && <footer className="ui-drawer__footer">{footer}</footer>}
      </aside>
    </div>
  );
}
