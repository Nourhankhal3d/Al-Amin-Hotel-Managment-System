import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../core/auth/authManager';
import { ROUTES } from '../../core/constants/routes';

// Temporary local testing bypass; DEV prevents it from affecting production builds.
const TEMP_BYPASS_AUTH = import.meta.env.DEV;
const TEMP_BYPASS_PATHS: readonly string[] = ['/', ROUTES.payments, ROUTES.shiftReport];

function isTempBypassed(pathname: string): boolean {
  if (!TEMP_BYPASS_AUTH) return false;
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  return TEMP_BYPASS_PATHS.includes(normalizedPathname);
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (!isTempBypassed(pathname) && !getAuthSession()) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return children;
}
