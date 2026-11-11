export const ROLES = {
  admin: 'Admin',
  manager: 'Manager',
  receptionist: 'Receptionist',
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  // Provisionally 'sub_manager' in backend (TODO: confirm with backend role enum)
  subManager: 'SubManager',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

