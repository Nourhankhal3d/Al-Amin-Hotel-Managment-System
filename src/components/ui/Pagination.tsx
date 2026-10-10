import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import './Pagination.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  navigationLabel?: string;
}

export function Pagination({ page, totalPages, onPageChange, pageLabel, previousLabel = 'Previous page', nextLabel = 'Next page', navigationLabel = 'Pagination' }: PaginationProps) {
  const language = document.documentElement.lang === 'en' ? 'en' : 'ar';
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const previousIcon = language === 'ar' ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />;
  const nextIcon = language === 'ar' ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />;

  return (
    <nav className="ui-pagination" aria-label={navigationLabel}>
      <span className="ui-pagination__label">{pageLabel ?? `${formatNumber(page, language)} / ${formatNumber(totalPages, language)}`}</span>
      <div className="ui-pagination__controls">
        <Button variant="secondary" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label={previousLabel}>{previousIcon}</Button>
        <div className="ui-pagination__pages">
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`ui-pagination__page${pageNumber === page ? ' ui-pagination__page--active' : ''}`}
              aria-current={pageNumber === page ? 'page' : undefined}
              aria-label={`${formatNumber(pageNumber, language)}`}
              onClick={() => onPageChange(pageNumber)}
            >
              {formatNumber(pageNumber, language)}
            </button>
          ))}
        </div>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={nextLabel}>{nextIcon}</Button>
      </div>
    </nav>
  );
}
