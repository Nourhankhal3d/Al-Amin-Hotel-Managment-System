// Constants for Manager Reports
// Based on Manager API Contract v1.2 and Figma 4-Reports design slices

export const REPORTS_BUSINESS_DATE = '2025-06-18';

export const REPORT_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const PAYMENT_METHOD_COLORS = {
  cash: 'var(--color-primary, #41C06A)',
  instapay: 'var(--color-chart-light-green, #9FD6AE)',
  vodafone: 'var(--color-gold, #C9A768)',
} as const;

export const EXPENSE_CATEGORY_COLORS = {
  cleaning: 'var(--color-gold, #C9A768)',
  utilities: 'var(--color-chart-light-green, #9FD6AE)',
  maintenance: 'var(--color-primary, #41C06A)',
  emergency: 'var(--color-gold-ink, #8A6D3B)',
} as const;

export const MONTH_NAMES_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

export const MONTH_NAMES_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
