export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  rooms: '/rooms',
  housekeeping: '/housekeeping',
  maintenance: '/maintenance',
  payments: '/payments',
  shiftHandover: '/shift-handover',
  shiftReport: '/shift-report',
  profile: '/profile',
  settings: '/settings',

  // Manager routes
  managerDashboard: '/manager/dashboard',
  managerRooms: '/manager/rooms',
  managerEmployees: '/manager/employees',
  managerHousekeeping: '/manager/housekeeping',
  managerMaintenance: '/manager/maintenance',
  managerFinance: '/manager/finance',
  managerReports: '/manager/reports',
  managerRefunds: '/manager/refunds',
  managerPasswordRequests: '/manager/password-requests',
  managerShifts: '/manager/shifts',
  managerRoomTypes: '/manager/room-types',
  managerProfile: '/manager/profile',
  managerSettings: '/manager/settings',

  // Sub-Manager routes
  subManager: '/sub-manager',
  subManagerDashboard: '/sub-manager/dashboard',
  subManagerFinance: '/sub-manager/finance',
  subManagerReports: '/sub-manager/reports',
  subManagerProfile: '/sub-manager/profile',
  subManagerSettings: '/sub-manager/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
