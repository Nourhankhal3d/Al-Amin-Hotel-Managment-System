// Zod-free schema and validator for ReportFilters
// Follows the lightweight validation pattern used across the codebase

import type { ReportFilters, ReportPeriod } from '../types/manager-reports.types';
import { REPORTS_BUSINESS_DATE } from '../constants/reports.constants';

const VALID_PERIODS: readonly ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function getDefaultReportFilters(date = REPORTS_BUSINESS_DATE): ReportFilters {
  return {
    date,
    period: 'daily',
    floor: 'ALL',
    roomType: 'ALL',
    shift: 'ALL',
    roomStatus: 'ALL',
    paymentMethod: 'ALL',
    expenseCategory: 'ALL',
  };
}

export interface ValidateReportFiltersResult {
  isValid: boolean;
  errors: Partial<Record<keyof ReportFilters, string>>;
  sanitized: ReportFilters;
}

export function validateReportFilters(
  input: Partial<ReportFilters> = {},
): ValidateReportFiltersResult {
  const errors: Partial<Record<keyof ReportFilters, string>> = {};

  // 1. Period validation
  let period: ReportPeriod = 'daily';
  if (input.period) {
    if (VALID_PERIODS.includes(input.period)) {
      period = input.period;
    } else {
      errors.period = 'فترة التقرير المحددة غير صالحة';
    }
  }

  // 2. Date validation
  let date = REPORTS_BUSINESS_DATE;
  if (input.date) {
    const trimmedDate = input.date.trim();
    if (DATE_REGEX.test(trimmedDate)) {
      date = trimmedDate;
    } else {
      errors.date = 'صيغة التاريخ يجب أن تكون YYYY-MM-DD';
    }
  }

  // 3. Select fields sanitization
  const floor = (input.floor || 'ALL').trim();
  const roomType = (input.roomType || 'ALL').trim();
  const shift = (input.shift || 'ALL').trim();
  const roomStatus = (input.roomStatus || 'ALL').trim();
  const paymentMethod = (input.paymentMethod || 'ALL').trim();
  const expenseCategory = (input.expenseCategory || 'ALL').trim();

  const sanitized: ReportFilters = {
    date,
    period,
    floor,
    roomType,
    shift,
    roomStatus,
    paymentMethod,
    expenseCategory,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
