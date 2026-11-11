import type { ReactNode } from 'react';
import { useLanguage } from '../../core/i18n/useLanguage';
import { formatNumber, formatPercent } from '../../utils/format';
import './DonutChart.css';

export type DonutSegmentTone = 'green' | 'light-green' | 'gold' | string;

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  tone: DonutSegmentTone;
  /** Optional custom color override if not using standard tone token */
  color?: string;
}

export interface DonutChartProps {
  /** Array of data segments to render */
  segments: DonutSegment[];
  /** Thickness of the donut ring in pixels (default: 26) */
  thickness?: number;
  /** Outer diameter of the donut chart in pixels (default: 180) */
  size?: number;
  /** Primary center value (e.g. total count, amount, or percentage) */
  centerValue?: string | number;
  /** Subtitle / unit label displayed below centerValue */
  centerLabel?: ReactNode;
  /** Whether to show the legend underneath/beside the chart (default: true) */
  showLegend?: boolean;
  /** Legend layout position (default: 'bottom') */
  legendPosition?: 'bottom' | 'side';
  /** Accessible label for the graphic */
  ariaLabel?: string;
  /** Additional CSS class names */
  className?: string;
}

function resolveSegmentColor(tone: DonutSegmentTone, customColor?: string): string {
  if (customColor) return customColor;
  switch (tone) {
    case 'green':
    case 'primary':
      return 'var(--color-primary)';
    case 'light-green':
      return 'var(--color-chart-light-green)';
    case 'gold':
      return 'var(--color-gold)';
    default:
      return 'var(--color-primary)';
  }
}

export function DonutChart({
  segments,
  thickness = 26,
  size = 180,
  centerValue,
  centerLabel,
  showLegend = true,
  legendPosition = 'bottom',
  ariaLabel = 'مخطط التوزيع الدائري',
  className = '',
}: DonutChartProps) {
  const { language } = useLanguage();

  const total = segments.reduce((sum, seg) => sum + (seg.value > 0 ? seg.value : 0), 0);
  const activeSegments = segments.filter((seg) => seg.value > 0);

  const radius = Math.max(1, (size - thickness) / 2);
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate gaps between segments if more than one active segment
  const gap = activeSegments.length > 1 ? 3 : 0;
  const totalGap = gap * activeSegments.length;
  const availableCircumference = Math.max(0, circumference - totalGap);

  let accumulatedOffset = 0;

  return (
    <div
      className={`donut-chart ${legendPosition === 'side' ? 'donut-chart--side' : ''} ${className}`.trim()}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="donut-chart__ring-wrapper" style={{ width: size, height: size }}>
        <svg
          className="donut-chart__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          {/* Subtle background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-primary-softer)"
            strokeWidth={thickness}
          />

          {total > 0 &&
            segments.map((seg) => {
              if (seg.value <= 0) return null;
              const fraction = seg.value / total;
              const dashLength = fraction * availableCircumference;
              const dashArray = `${dashLength} ${circumference - dashLength}`;
              const strokeOffset = -accumulatedOffset;
              accumulatedOffset += dashLength + gap;

              const strokeColor = resolveSegmentColor(seg.tone, seg.color);

              return (
                <circle
                  key={seg.key}
                  className="donut-chart__segment"
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={thickness}
                  strokeDasharray={dashArray}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                >
                  <title>{`${seg.label}: ${formatPercent(fraction * 100, language)}`}</title>
                </circle>
              );
            })}
        </svg>

        {(centerValue !== undefined || centerLabel !== undefined) && (
          <div className="donut-chart__center">
            {centerValue !== undefined && (
              <strong className="donut-chart__center-value">
                {typeof centerValue === 'number' ? formatNumber(centerValue, language) : centerValue}
              </strong>
            )}
            {centerLabel !== undefined && (
              <span className="donut-chart__center-label">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {showLegend && segments.length > 0 && (
        <ul className="donut-chart__legend" aria-hidden="true">
          {segments.map((seg) => {
            const fraction = total > 0 ? (seg.value / total) * 100 : 0;
            const dotColor = resolveSegmentColor(seg.tone, seg.color);
            return (
              <li key={seg.key} className="donut-chart__legend-item">
                <span
                  className={`donut-chart__dot donut-chart__dot--${seg.tone}`}
                  style={{ backgroundColor: dotColor }}
                />
                <span className="donut-chart__legend-label">{seg.label}</span>
                <span className="donut-chart__legend-percent">
                  {formatPercent(fraction, language)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
