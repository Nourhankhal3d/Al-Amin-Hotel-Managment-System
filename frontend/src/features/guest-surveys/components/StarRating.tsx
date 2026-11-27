import { Star } from 'lucide-react';
import { MAX_STARS } from '../constants/guestSurveys.constants';
import './StarRating.css';

interface StarRatingProps {
  /** Unique per question: groups the radio buttons */
  name: string;
  /** Id of the visible question text */
  labelledBy: string;
  value: number;
  /** "3 of 5" — {value} and {max} are replaced */
  starLabel: string;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  invalid?: boolean;
  size?: 'md' | 'lg';
}

// Five radio buttons drawn as stars, so the keyboard (arrows) and screen readers work as usual.
// Stars always run left to right, as in the design, in both languages.
export function StarRating({ name, labelledBy, value, starLabel, onChange, readOnly = false, invalid = false, size = 'md' }: StarRatingProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      aria-readonly={readOnly || undefined}
      className={`star-rating star-rating--${size}${readOnly ? ' star-rating--readonly' : ''}`}
    >
      {Array.from({ length: MAX_STARS }, (_, index) => {
        const star = index + 1;
        const isOn = star <= value;
        return (
          <label key={star} className={`star-rating__star${isOn ? ' star-rating__star--on' : ''}`}>
            <input
              type="radio"
              className="star-rating__input"
              name={name}
              value={star}
              checked={value === star}
              disabled={readOnly}
              onChange={() => onChange?.(star)}
              aria-label={starLabel.replace('{value}', String(star)).replace('{max}', String(MAX_STARS))}
            />
            <Star aria-hidden="true" fill={isOn ? 'currentColor' : 'none'} />
          </label>
        );
      })}
    </div>
  );
}
