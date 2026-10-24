import type { Role } from '../constants/roles';
import { setAccessToken } from '../api/apiClient';

export interface AuthSession {
  role: Role;
  userId: string;
  staffName: string;
  readOnly: boolean;
  email?: string;
}

const sessionKey = 'al-amin-auth-session';
const developmentSession: AuthSession = {
  role: 'Receptionist',
  userId: '018',
  staffName: 'مريم أحمد',
  readOnly: true,
  email: 'reception@alaminhotel.com',
};

export function getAuthSession(): AuthSession | null {
  try {
    const value = window.localStorage.getItem(sessionKey);
    if (value) return JSON.parse(value) as AuthSession;
    return import.meta.env.DEV ? developmentSession : null;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return import.meta.env.DEV ? developmentSession : null;
  }
}

export function setAuthSession(session: AuthSession): void {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(sessionKey);
  setAccessToken(null);
}
