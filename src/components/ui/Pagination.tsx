import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <Button variant="ghost" disabled={page === 1} onClick={() => onPageChange(page - 1)}>←</Button>
      <span>{page} / {totalPages}</span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>→</Button>
    </nav>
  );
}
