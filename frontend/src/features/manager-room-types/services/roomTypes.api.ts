import { request } from '../../../core/api/apiClient';
import type { RoomType, RoomTypeUpdate } from '../types/roomType.types';
import type { RoomListResponseDto } from '../../manager-rooms/types/manager-rooms.dto';
import type { ManagerRoom } from '../../manager-rooms/types/manager-rooms.types';
import { mapRoomDtoToManagerRoom } from '../../manager-rooms/services/manager-rooms.mappers';

export function normalizeRoomType(raw: any): RoomType {
  const id = String(raw.room_type_id || raw.id || '');
  return {
    id,
    room_type_id: id,
    name: raw.name || '',
    base_price: Number(raw.base_price) || 0,
    capacity: Number(raw.capacity) || 1,
    description: raw.description || '',
    is_active: raw.is_active !== false,
    rooms_count: Number(raw.rooms_count) || 0,
    price_min: Number(raw.price_min ?? raw.base_price) || 0,
    price_max: Number(raw.price_max ?? raw.base_price) || 0,
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    occupancy_rate_pct: Number(raw.occupancy_rate_pct) || 0,
    revenue_month_to_date: Number(raw.revenue_month_to_date) || 0,
  };
}

export async function getRoomTypes(): Promise<RoomType[]> {
  const response = await request<{ data: any[] }>('/room-types');
  return (response.data || []).map(normalizeRoomType);
}

export async function updateRoomType(id: string, body: RoomTypeUpdate): Promise<RoomType> {
  const response = await request<{ data: any }>(`/room-types/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  });
  return normalizeRoomType(response.data);
}

/** "تحديث الأسعار" saves every changed base price; the contract has no bulk endpoint */
export async function updateBasePrices(prices: Array<{ id: string; base_price: number }>): Promise<RoomType[]> {
  return Promise.all(prices.map(({ id, base_price }) => updateRoomType(id, { base_price })));
}

/** Fetch rooms belonging to this specific room type */
export async function getRoomsForType(roomTypeId: string): Promise<ManagerRoom[]> {
  const response = await request<RoomListResponseDto>(
    `/manager/rooms?room_type_id=${encodeURIComponent(roomTypeId)}&limit=100`
  );
  return (response.data || []).map((dto) => mapRoomDtoToManagerRoom(dto));
}

/** Fetch all rooms across the hotel */
export async function getAllHotelRooms(): Promise<ManagerRoom[]> {
  const response = await request<RoomListResponseDto>('/manager/rooms?limit=100');
  return (response.data || []).map((dto) => mapRoomDtoToManagerRoom(dto));
}

/** Update individual room price */
export async function updateRoomPrice(roomId: string, price_per_night: number): Promise<void> {
  await request(`/manager/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PATCH',
    body: { price_per_night },
  });
}

/** Reassign room to this type */
export async function assignRoomToType(roomId: string, room_type_id: string): Promise<void> {
  await request(`/manager/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PATCH',
    body: { room_type_id },
  });
}
