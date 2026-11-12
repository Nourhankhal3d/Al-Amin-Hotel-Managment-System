import { ProgressBar, type ProgressBarTone } from '../../../components/ui/ProgressBar';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatPercent } from '../../../utils/format';
import type { ReportSnapshot } from '../types/manager-reports.types';
import './ExpenseCategoriesCard.css';

export interface ExpenseCategoriesCardProps {
  snapshot: ReportSnapshot;
  className?: string;
}

export function ExpenseCategoriesCard({
  snapshot,
  className = '',
}: ExpenseCategoriesCardProps) {
  const { language, t } = useLanguage();

  const categories = snapshot.expenseCategories ?? [];

  return (
    <article
      className={`expense-categories-card ${className}`.trim()}
      aria-label={t('manager.reports.expenseCategories.title')}
    >
      <header className="expense-categories-card__header">
        <h3 className="expense-categories-card__title">
          {t('manager.reports.expenseCategories.title')}
        </h3>
        <p className="expense-categories-card__subtitle">
          {t('manager.reports.expenseCategories.subtitle')}
        </p>
      </header>

      <div className="expense-categories-card__rows">
        {categories.map((item) => {
          let tone: ProgressBarTone = 'success';
          let rowModifier = '';

          const idLower = item.id.toLowerCase();
          if (idLower.includes('clean') || idLower.includes('تنظيف')) {
            tone = 'gold';
          } else if (idLower.includes('util') || idLower.includes('كهرباء') || idLower.includes('مياه')) {
            tone = 'success';
            rowModifier = 'expense-categories-card__row--utilities';
          } else if (idLower.includes('maint') || idLower.includes('صيانة')) {
            tone = 'success';
          } else {
            tone = 'gold';
            rowModifier = 'expense-categories-card__row--other';
          }

          const valueText = formatPercent(item.percentage, language);

          return (
            <div
              key={item.id}
              className={`expense-categories-card__row ${rowModifier}`.trim()}
            >
              <ProgressBar
                label={item.label}
                value={item.percentage}
                valueText={valueText}
                tone={tone}
                layout="stacked"
                size="md"
              />
            </div>
          );
        })}
      </div>
    </article>
  );
}
