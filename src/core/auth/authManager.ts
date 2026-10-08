import type { Role } from '../constants/roles';

export interface AuthSession {
  token?: string;
  role: Role;
  userId: string;
}

const sessionKey = 'al-amin-auth-session';

export function getAuthSession(): AuthSession | null {
  const value = window.localStorage.getItem(sessionKey);
  return value ? (JSON.parse(value) as AuthSession) : null;
}

export function setAuthSession(session: AuthSession): void {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(sessionKey);
}
