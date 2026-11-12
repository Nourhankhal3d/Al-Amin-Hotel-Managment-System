// Mappers for Manager Finance (DTO -> UI Model)

import type {
  FinancePaymentDto,
  FinanceExpenseDto,
  DailyClosingCurrentDto,
  HourlyRevenueDto,
} from '../types/manager-finance.dto';
import type {
  FinanceTransaction,
  FinanceExpense,
  FinanceSummary,
  UiPaymentMethod,
  UiTransactionType,
  UiTransactionStatus,
  UiExpenseCategory,
} from '../types/manager-finance.types';
import { formatCurrency, formatClock } from '../../../utils/format';

function parseMethod(raw: string): UiPaymentMethod {
  const norm = raw.toUpperCase();
  if (norm === 'CASH') return 'cash';
  if (norm === 'INSTAPAY') return 'instapay';
  if (norm === 'VODAFONE_CASH' || norm === 'VODAFONE') return 'vodafone';
  return 'card';
}

function methodLabel(method: UiPaymentMethod, isAr: boolean): string {
  switch (method) {
    case 'cash':
      return isAr ? 'نقدًا' : 'Cash';
    case 'instapay':
      return isAr ? 'إنستاباي' : 'Instapay';
    case 'vodafone':
      return isAr ? 'فودافون كاش' : 'Vodafone Cash';
    case 'card':
      return isAr ? 'بطاقة بنكية' : 'Card';
  }
}

function parseType(raw: string): UiTransactionType {
  const norm = raw.toUpperCase();
  if (norm === 'BOOKING') return 'booking';
  if (norm === 'SERVICE') return 'service';
  if (norm === 'REFUND') return 'refund';
  return 'deposit';
}

function typeLabel(type: UiTransactionType, isAr: boolean): string {
  switch (type) {
    case 'booking':
      return isAr ? 'حجز غرفة' : 'Room Booking';
    case 'service':
      return isAr ? 'خدمات إضافية' : 'Service';
    case 'refund':
      return isAr ? 'استرداد أموال' : 'Refund';
    case 'deposit':
      return isAr ? 'عربون تأمين' : 'Security Deposit';
  }
}

function parseStatus(raw: string): UiTransactionStatus {
  const norm = raw.toUpperCase();
  if (norm === 'COMPLETED') return 'completed';
  if (norm === 'PENDING') return 'pending';
  if (norm === 'REFUNDED') return 'refunded';
  return 'cancelled';
}

function statusLabel(status: UiTransactionStatus, isAr: boolean): string {
  switch (status) {
    case 'completed':
      return isAr ? 'مكتملة' : 'Completed';
    case 'pending':
      return isAr ? 'معلقة' : 'Pending';
    case 'refunded':
      return isAr ? 'مستردة' : 'Refunded';
    case 'cancelled':
      return isAr ? 'ملغاة' : 'Cancelled';
  }
}

function parseCategory(raw: string): UiExpenseCategory {
  const norm = raw.toUpperCase();
  if (norm === 'CLEANING') return 'cleaning';
  if (norm === 'MAINTENANCE') return 'maintenance';
  if (norm === 'UTILITIES') return 'utilities';
  if (norm === 'EMERGENCY') return 'emergency';
  return 'other';
}

function categoryLabel(cat: UiExpenseCategory, isAr: boolean): string {
  switch (cat) {
    case 'cleaning':
      return isAr ? 'مستلزمات تنظيف' : 'Cleaning Supplies';
    case 'maintenance':
      return isAr ? 'مستلزمات صيانة' : 'Maintenance Supplies';
    case 'utilities':
      return isAr ? 'كهرباء' : 'Electricity';
    case 'emergency':
      return isAr ? 'مصروفات طارئة' : 'Emergency Expenses';
    case 'other':
      return isAr ? 'أخرى' : 'Other';
  }
}

function formatTime(iso: string, isAr: boolean): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return formatClock(d, isAr ? 'ar' : 'en');
  } catch {
    return '—';
  }
}

export function mapPaymentDtoToTransaction(
  dto: FinancePaymentDto,
  language: 'ar' | 'en' = 'ar',
): FinanceTransaction {
  const isAr = language === 'ar';
  const method = parseMethod(dto.method);
  const type = parseType(dto.type);
  const status = parseStatus(dto.status);

  return {
    id: dto.payment_id,
    transactionNumber: dto.transaction_number,
    bookingId: dto.booking_id ?? undefined,
    roomNumber: dto.room_number ? String(dto.room_number) : '—',
    guestName: dto.guest_name || (isAr ? 'نزيل نزيل' : 'Guest'),
    amount: dto.amount,
    formattedAmount: formatCurrency(dto.amount, language),
    currency: dto.currency || 'EGP',
    method,
    methodLabel: methodLabel(method, isAr),
    type,
    typeLabel: typeLabel(type, isAr),
    status,
    statusLabel: statusLabel(status, isAr),
    time: formatTime(dto.created_at, isAr),
    date: dto.business_date,
    isoDate: dto.created_at,
    shiftId: dto.shift_id ?? undefined,
    shiftName: dto.shift_type
      ? isAr
        ? dto.shift_type === 'morning'
          ? 'الوردية الصباحية'
          : dto.shift_type === 'evening'
            ? 'الوردية المسائية'
            : 'الوردية الليلية'
        : `${dto.shift_type.charAt(0).toUpperCase() + dto.shift_type.slice(1)} Shift`
      : undefined,
    staffId: dto.staff_id,
    staffName: dto.staff_name,
    notes: dto.notes ?? undefined,
    refundRequestId: dto.refund_request_id ?? undefined,
    refundReason: dto.refund_reason ?? undefined,
  };
}

export function mapExpenseDtoToExpense(
  dto: FinanceExpenseDto,
  language: 'ar' | 'en' = 'ar',
): FinanceExpense {
  const isAr = language === 'ar';
  const category = parseCategory(dto.category);

  return {
    id: dto.expense_id,
    expenseNumber: dto.expense_id,
    description: dto.description,
    category,
    categoryLabel: categoryLabel(category, isAr),
    amount: dto.amount,
    formattedAmount: formatCurrency(dto.amount, language),
    currency: dto.currency || 'EGP',
    recordedByName: dto.recorded_by_staff_name,
    recordedById: dto.recorded_by_staff_id,
    time: formatTime(dto.created_at, isAr),
    date: dto.business_date,
    isoDate: dto.created_at,
    notes: dto.notes ?? undefined,
    invoiceUrl: dto.invoice_url ?? undefined,
  };
}

export function mapDailyClosingToSummary(
  closing: DailyClosingCurrentDto,
  expenses: FinanceExpenseDto[] = [],
  hourly?: HourlyRevenueDto,
): FinanceSummary {
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const revenue = closing.total_revenue; // total_revenue = gross_revenue - refunds_total
  const netProfit = revenue - expensesTotal;

  return {
    revenue,
    expenses: expensesTotal,
    netProfit,
    refunded: closing.refunds_total,
    transactionsCount: closing.transactions_count,
    methodTotals: {
      cash: closing.cash_total,
      instapay: closing.instapay_total,
      vodafone: closing.vodafone_cash_total,
      card: 0,
    },
    hourlyRevenue: {
      points: hourly?.points ?? [],
      labels: hourly?.hours ?? [],
    },
  };
}
