import type { Role } from '../../../core/constants/roles';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  confirmPassword: string;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  lastLogin: string;
  status: 'active' | 'inactive';
}
