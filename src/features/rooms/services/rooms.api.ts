import { apiRequest } from '../../../core/api/apiClient';
import type { Language } from '../../../core/i18n';
import {
  addMockRoomActivity,
  getMockRoom,
  getMockRoomStats,
  listMockRooms,
  updateMockRoom,
} from '../../../mocks/rooms';
import type { AddRoomActivityInput, Room, RoomFilters, RoomStats, UpdateRoomInput } from '../types/room.types';
import { filterAndSortRooms } from '../utils/roomDisplay';

export interface RoomListResult {
  rows: Room[];
  matchingRooms: Room[];
  total: number;
}

export const roomQueryKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomQueryKeys.all, 'list'] as const,
  list: (filters: RoomFilters, language: Language) => [...roomQueryKeys.lists(), filters, language] as const,
  stats: () => [...roomQueryKeys.all, 'stats'] as const,
  detail: (id: string) => [...roomQueryKeys.all, 'detail', id] as const,
};

export async function getRooms(): Promise<Room[]> {
  try {
    const response = await apiRequest<Room[]>('/rooms');
    if (Array.isArray(response)) return response;
  } catch {
    return listMockRooms();
  }
  return listMockRooms();
}

export async function listRooms(filters: RoomFilters, language: Language, pageSize: number): Promise<RoomListResult> {
  const matchingRooms = filterAndSortRooms(await getRooms(), filters, language);
  const start = (filters.page - 1) * pageSize;
  return {
    rows: matchingRooms.slice(start, start + pageSize),
    matchingRooms,
    total: matchingRooms.length,
  };
}

export async function getRoom(id: string): Promise<Room | undefined> {
  return getMockRoom(id);
}

export async function getRoomStats(): Promise<RoomStats> {
  return getMockRoomStats();
}

export async function saveRoom(input: UpdateRoomInput): Promise<Room | undefined> {
  return updateMockRoom(input);
}

export async function saveRoomActivity(input: AddRoomActivityInput): Promise<Room | undefined> {
  return addMockRoomActivity(input);
}
