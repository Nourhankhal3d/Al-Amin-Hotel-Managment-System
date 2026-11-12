import type { ReactNode } from 'react';
import { useLanguage } from '../../core/i18n/useLanguage';
import { formatNumber } from '../../utils/format';
import './GroupedBarChart.css';

export type BarSeriesTone = 'green' | 'gold' | 'light-green' | 'primary' | string;

export interface BarSeries {
  key: string;
  label: string;
  values: number[];
  tone: BarSeriesTone;
  /** Optional custom color override */
  color?: string;
  /** Bar width styling: 'wide' (default for primary metric) or 'thin' (for secondary metric) */
  variant?: 'wide' | 'thin';
}

export interface GroupedBarChartProps {
  /** Array of category labels along the axis (e.g. 12 month names) */
  categories: string[];
  /** Data series to plot per category */
  series: BarSeries[];
  /** Plot area height in pixels (default: 200) */
  height?: number;
  /** Optional section title */
  title?: string;
  /** Optional subtitle or date range */
  subtitle?: string;
  /** Optional badge slot (e.g. status badge or percentage growth) */
  badge?: ReactNode;
  /** Whether to show the legend indicators in the header (default: true) */
  showLegend?: boolean;
  /** Force showing all labels instead of first/middle/last (default: false) */
  showAllLabels?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Additional CSS class names */
  className?: string;
}

function resolveBarColor(tone: BarSeriesTone, customColor?: string): string {
  if (customColor) return customColor;
  switch (tone) {
    case 'green':
    case 'primary':
      return 'var(--color-primary)';
    case 'gold':
      return 'var(--color-gold)';
    case 'light-green':
      return 'var(--color-chart-light-green)';
    default:
      return 'var(--color-primary)';
  }
}

export function GroupedBarChart({
  categories,
  series,
  height = 200,
  title,
  subtitle,
  badge,
  showLegend = true,
  showAllLabels = false,
  ariaLabel = 'مخطط بياني للمقارنة',
  className = '',
}: GroupedBarChartProps) {
  const { language } = useLanguage();

  const allValues = series.flatMap((s) => s.values);
  const maxValue = Math.max(...allValues, 1);

  const totalCategories = categories.length;
  const firstIndex = 0;
  const middleIndex = Math.floor((totalCategories - 1) / 2);
  const lastIndex = totalCategories - 1;

  const shouldShowLabel = (idx: number) => {
    if (showAllLabels || totalCategories <= 4) return true;
    return idx === firstIndex || idx === middleIndex || idx === lastIndex;
  };

  return (
    <div
      className={`grouped-bar-chart ${className}`.trim()}
      role="img"
      aria-label={ariaLabel}
    >
      {(title || subtitle || badge || (showLegend && series.length > 0)) && (
        <div className="grouped-bar-chart__header">
          {(title || subtitle) && (
            <div className="grouped-bar-chart__heading">
              {title && <h3 className="grouped-bar-chart__title">{title}</h3>}
              {subtitle && <p className="grouped-bar-chart__subtitle">{subtitle}</p>}
            </div>
          )}

          <div className="grouped-bar-chart__actions">
            {showLegend && series.length > 0 && (
              <ul className="grouped-bar-chart__legend" aria-hidden="true">
                {series.map((s) => (
                  <li key={s.key} className="grouped-bar-chart__legend-item">
                    <span
                      className={`grouped-bar-chart__legend-dot grouped-bar-chart__legend-dot--${s.tone}`}
                      style={{ backgroundColor: resolveBarColor(s.tone, s.color) }}
                    />
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
            )}
            {badge && <div className="grouped-bar-chart__badge">{badge}</div>}
          </div>
        </div>
      )}

      <div className="grouped-bar-chart__plot-container">
        <div className="grouped-bar-chart__plot" style={{ height }}>
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="grouped-bar-chart__col">
              {/* Pale full-height backdrop bar */}
              <div className="grouped-bar-chart__backdrop" />

              {/* Grouped series bars */}
              <div className="grouped-bar-chart__bars">
                {series.map((s, seriesIdx) => {
                  const val = s.values[catIdx] ?? 0;
                  const pct = Math.min(100, Math.max(0, (val / maxValue) * 100));
                  const variant = s.variant ?? (seriesIdx === 0 ? 'wide' : 'thin');
                  const barColor = resolveBarColor(s.tone, s.color);

                  return (
                    <div
                      key={s.key}
                      className={`grouped-bar-chart__bar grouped-bar-chart__bar--${variant} grouped-bar-chart__bar--${s.tone}`}
                      style={{
                        height: val > 0 ? `${Math.max(2, pct)}%` : '0%',
                        backgroundColor: barColor,
                      }}
                      title={`${s.label} (${cat}): ${formatNumber(val, language)}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Baseline rule */}
        <div className="grouped-bar-chart__baseline" />

        {/* Category labels row (first, middle, last) */}
        <div className="grouped-bar-chart__labels" aria-hidden="true">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="grouped-bar-chart__label-col">
              {shouldShowLabel(catIdx) ? cat : '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
