import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="ui-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <div className="ui-dialog__actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  );
}
