export type RoomType = 'standard' | 'vip';
export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
export type RoomFloor = 1 | 2 | 3;
export type RoomAvailability = 'all' | 'available' | 'unavailable';

export interface RoomLogEntry {
  id: string;
  titleKey: string;
  descriptionKey: string;
  time: string;
}

export interface Room {
  id: string;
  number: string;
  type: RoomType; // TODO: confirm with backend
  status: RoomStatus; // TODO: confirm with backend
  floor: RoomFloor; // TODO: confirm with backend
  view: 'nile' | 'garden' | 'city'; // TODO: confirm with backend
  guestName?: string;
  guestNameKey?: string;
  arrivalDate?: string;
  notes: string;
  notesKey?: string;
  updatedAt: string;
  log: RoomLogEntry[];
  /** بالجنيه المصري (الباك إند بيرجّعها بعد toEgp) */
  pricePerNight?: number;
  /** سعر نصف اليوم / الوصول المبكر بالجنيه */
  halfDayPrice?: number;
}

export interface RoomFilters {
  q: string;
  type: RoomType | '';
  status: RoomStatus | '';
  floor: RoomFloor | '';
  availability: RoomAvailability;
  page: number;
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
  vip: number;
}

export interface UpdateRoomInput {
  id: string;
  status: RoomStatus;
  notes: string;
}

 export type PaymentMethod = 'cash' | 'instapay' | 'vodafone_cash';

export interface WalkInInput {
  roomId: string;
  guest: { name: string; phone: string; idNumber: string };
  checkIn: string;
  checkOut: string;
  earlyArrival: boolean;
  payment: { amount: number; method: PaymentMethod; notes?: string };
  idempotencyKey: string;
}

export interface WalkInResult {
  reservation_id: string;
  status: string;
}