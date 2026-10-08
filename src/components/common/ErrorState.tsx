interface ErrorStateProps {
  title?: string;
  message: string;
}

export function ErrorState({ title = 'Unable to load this page', message }: ErrorStateProps) {
  return <div className="ui-error-state"><strong>{title}</strong><p>{message}</p></div>;
}
