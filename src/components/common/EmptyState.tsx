interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return <div className="ui-empty-state"><strong>{title}</strong>{description && <p>{description}</p>}</div>;
}
