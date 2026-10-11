import type { Role } from '../../../core/constants/roles';

export interface LoginCredentials {
  email: string;
  password: string;
}



export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  lastLogin: string;
  status: 'active' | 'inactive';
}
