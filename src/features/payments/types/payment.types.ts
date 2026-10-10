import type { PaymentMethod } from '../../../types/common.types';

export interface Payment {
  payment_id: number;
  reservation_id: number;
  staff_id: number;
  shift_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_datetime: string;
  payment_verified: boolean;
  notes?: string | null;
  reversal_of_payment_id?: number | null;
}

// الموظف يبعت دول بس. الوقت والوردية والموظف السيرفر بيحطهم.
export interface PaymentCreate {
  reservation_id?: number; // المفضّل
  room_id?: number; // لو reservation_id مش موجود
  amount: number; // > 0 و <= المتبقي
  payment_method: PaymentMethod;
  notes?: string;
}

export interface PaymentResult {
  payment: Payment;
  paid_amount: number;
  remaining_amount: number;
}