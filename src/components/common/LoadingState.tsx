import { Spinner } from '../ui/Spinner';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <div className="ui-loading-state"><Spinner label={label} /><span>{label}</span></div>;
}
