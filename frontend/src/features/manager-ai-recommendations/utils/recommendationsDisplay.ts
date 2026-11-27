import type { Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';

/** Cards show two digits, as in the design: 5 -> ٠٥ */
export function twoDigits(value: number, language: Language): string {
  return value >= 0 && value < 10 ? `${formatNumber(0, language)}${formatNumber(value, language)}` : formatNumber(value, language);
}

/**
 * Arabic count words: 1 -> "one", 2 -> "two", 3..10 -> "few", otherwise "many".
 * The i18n block holds `<base>.one|two|few|many` with {count}.
 */
export function pluralText(t: (key: string) => string, base: string, count: number, language: Language): string {
  let form = 'many';
  if (language === 'ar') {
    if (count === 1) form = 'one';
    else if (count === 2) form = 'two';
    else if (count >= 3 && count <= 10) form = 'few';
  } else if (count === 1) {
    form = 'one';
  }
  return t(`${base}.${form}`).replace('{count}', formatNumber(count, language));
}
