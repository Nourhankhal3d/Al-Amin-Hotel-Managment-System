import { request } from '../../../core/api/apiClient';
import type { Language } from '../../../core/i18n';
import type { Paginated } from '../../../core/api/api.types';
import type { AddRoomActivityInput, Room, RoomFilters, RoomFloor, RoomStats, RoomStatus, UpdateRoomInput } from '../types/room.types';
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

const ROOM_FETCH_LIMIT = 100;

interface ApiRoom {
  room_id: number;
  room_type: string;
  status: RoomStatus;
  description: string;
  price_per_night: number;
  half_day_price: number;
}

interface ApiRoomStatusHistory {
  history_id: number;
  room_id: number;
  status: RoomStatus;
  notes: string | null;
  changed_at: string;
  shift_id: number;
}

function mapApiRoom(room: ApiRoom): Room {
  const number = String(room.room_id);
  const firstDigit = Number(number[0]);
  // TODO: confirm with backend; floor is not provided, so the first room-number digit is a guess.
  const floor = (firstDigit >= 1 && firstDigit <= 3 ? firstDigit : 1) as RoomFloor;

  return {
    id: number,
    number,
    // TODO: confirm with backend; single/double do not define VIP, so non-VIP is a safe guess.
    type: room.room_type.toLowerCase() === 'vip' ? 'vip' : 'standard',
    status: room.status,
    floor,
    // TODO: confirm with backend; room view is not included in the API response.
    view: 'city',
    // TODO: confirm with backend; the API has no guest or arrival fields.
    notes: room.description,
    // TODO: confirm with backend; updatedAt and activity log are not part of GET /rooms.
    updatedAt: '',
    log: [],
  };
}

function mapStatusHistory(row: ApiRoomStatusHistory) {
  return {
    id: String(row.history_id),
    titleKey: `rooms.status.${row.status}`,
    descriptionKey: row.notes ?? '—',
    time: row.changed_at,
  };
}

export async function getRooms(): Promise<Room[]> {
  const response = await request<Paginated<ApiRoom>>('/rooms', {
    params: { page: 1, limit: ROOM_FETCH_LIMIT },
  });
  return response.data.map(mapApiRoom);
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
  const room = (await getRooms()).find((item) => item.id === id);
  if (!room) return undefined;

  const history = await request<Paginated<ApiRoomStatusHistory>>(`/rooms/${room.id}/status-history`, {
    params: { page: 1, limit: ROOM_FETCH_LIMIT },
  });
  return { ...room, log: history.data.map(mapStatusHistory) };
}

export async function getRoomStats(): Promise<RoomStats> {
  const rooms = await getRooms();
  return {
    total: rooms.length,
    available: rooms.filter((room) => room.status === 'available').length,
    occupied: rooms.filter((room) => room.status === 'occupied').length,
    cleaning: rooms.filter((room) => room.status === 'cleaning').length,
    maintenance: rooms.filter((room) => room.status === 'maintenance').length,
    vip: rooms.filter((room) => room.type === 'vip').length,
  };
}

export async function saveRoom(input: UpdateRoomInput): Promise<Room | undefined> {
  const room = await getRoom(input.id);
  if (!room) return undefined;

  const result = await request<ApiRoomStatusHistory>(`/rooms/${room.id}/status`, {
    method: 'PATCH',
    body: { status: input.status, notes: input.notes },
  });

  return {
    ...room,
    status: result.status,
    notes: result.notes ?? room.notes,
    updatedAt: result.changed_at,
    log: [mapStatusHistory(result), ...room.log],
  };
}

export async function saveRoomActivity(input: AddRoomActivityInput): Promise<Room | undefined> {
  // TODO: confirm with backend; guestName is not accepted by PATCH /rooms/{room_id}/status.
  return saveRoom({ id: input.roomId, status: input.status, notes: input.notes });
}
