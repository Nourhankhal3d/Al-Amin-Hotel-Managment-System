import type { RoomStatus } from '../../../types/common.types';

export interface Room {
  room_id: number;
  room_type: string;
  status: RoomStatus;
  description: string;
  price_per_night: number;
  half_day_price: number;
}

export interface RoomStatusHistory {
  history_id: number;
  room_id: number;
  status: RoomStatus;
  notes?: string | null;
  changed_at: string;
  shift_id: number;
}

// الموظف يقدر يختار الحالات التلاتة دي بس
export interface RoomStatusChange {
  status: 'available' | 'cleaning' | 'maintenance';
  notes?: string;
}