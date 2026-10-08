import { useEffect, useState } from 'react';
import type { Language } from '../i18n';

export function useDirection(language: Language): void {
  const [direction] = useState<'rtl' | 'ltr'>(() => (language === 'ar' ? 'rtl' : 'ltr'));

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);
}
