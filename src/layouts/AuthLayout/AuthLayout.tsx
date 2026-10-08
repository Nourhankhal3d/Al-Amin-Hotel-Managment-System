import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-layout"><section className="auth-layout__brand"><strong>أمين</strong><span>Hotel Management</span></section>{children}</main>;
}
