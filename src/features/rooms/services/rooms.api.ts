import { apiRequest } from '../../../core/api/apiClient';
import type { Room } from '../types/room.types';

export async function getRooms(): Promise<Room[]> {
  return apiRequest<Room[]>('/rooms');
}
