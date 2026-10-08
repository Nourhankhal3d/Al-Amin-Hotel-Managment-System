import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  if (!open) return null;

  return (
    <div className="ui-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="ui-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="ui-drawer__header">
          <h2>{title}</h2>
          <button type="button" className="ui-icon-button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="ui-drawer__content">{children}</div>
      </aside>
    </div>
  );
}
