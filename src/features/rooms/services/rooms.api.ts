
import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import type { Room } from '../types/room.types';

export async function getRooms(): Promise<Room[]> {
  const response = await request<Paginated<Room>>('/rooms');
  return response.data;
}