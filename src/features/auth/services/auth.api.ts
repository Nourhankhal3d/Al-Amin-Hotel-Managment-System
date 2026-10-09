import { apiRequest } from '../../../core/api/apiClient';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';
import type { Role } from '../../../core/constants/roles';

export interface AuthResponse {
  token: string;
  userId: string;
  role: Role;
  fullName?: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Must execute genuine API call. If backend is unavailable or credentials invalid, throw error.
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  // Must execute genuine API call. If backend is unavailable, throw error.
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}
