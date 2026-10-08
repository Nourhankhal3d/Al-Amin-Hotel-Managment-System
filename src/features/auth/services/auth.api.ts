import { apiRequest } from '../../../core/api/apiClient';
import type { LoginCredentials } from '../types/auth.types';

export async function login(credentials: LoginCredentials): Promise<{ token: string }> {
  return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}
