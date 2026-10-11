import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ToastProvider as CommonToastProvider } from '../../components/common/Toast';
import { ToastProvider } from '../../components/ui/Toast';
import { LanguageProvider } from '../../core/i18n/LanguageContext';
import { ThemeProvider } from '../../core/theme/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    // Mutations (payments, reservations, check-in...) must never be retried automatically
    mutations: { retry: false },
  },
});

// TODO: يوجد نظام Toast في components/ui (Member 3) وآخر في components/common (Member 4).
// بنركّب الاتنين مؤقتًا لحد ما الفريق يوحّدهم في نظام واحد.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <CommonToastProvider>{children}</CommonToastProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}