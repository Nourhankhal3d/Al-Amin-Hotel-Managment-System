import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignRoomToType,
  getAllHotelRooms,
  getRoomsForType,
  getRoomTypes,
  updateBasePrices,
  updateRoomPrice,
  updateRoomType,
} from '../services/roomTypes.api';
import type { RoomType, RoomTypeUpdate } from '../types/roomType.types';

export const roomTypesKeys = {
  all: ['manager-room-types'] as const,
  list: () => [...roomTypesKeys.all, 'list'] as const,
  roomsForType: (roomTypeId?: string) => [...roomTypesKeys.all, 'rooms', roomTypeId] as const,
  allRooms: () => [...roomTypesKeys.all, 'all-rooms'] as const,
};

export function useRoomTypes() {
  return useQuery({ queryKey: roomTypesKeys.list(), queryFn: getRoomTypes });
}

export function useRoomsForType(roomTypeId?: string) {
  return useQuery({
    queryKey: roomTypesKeys.roomsForType(roomTypeId),
    queryFn: () => (roomTypeId ? getRoomsForType(roomTypeId) : Promise.resolve([])),
    enabled: Boolean(roomTypeId),
  });
}

export function useAllHotelRooms() {
  return useQuery({
    queryKey: roomTypesKeys.allRooms(),
    queryFn: getAllHotelRooms,
  });
}

function mergeSaved(current: RoomType[] | undefined, saved: RoomType[]) {
  return current?.map((type) => saved.find((item) => item.room_type_id === type.room_type_id) ?? type);
}

// Both mutations write the server answer into the cache, so the cards update immediately
export function useUpdateRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RoomTypeUpdate }) => updateRoomType(id, body),
    onSuccess: (saved) => {
      queryClient.setQueryData<RoomType[]>(roomTypesKeys.list(), (current) => mergeSaved(current, [saved]));
      void queryClient.invalidateQueries({ queryKey: roomTypesKeys.all });
    },
  });
}

export function useUpdateBasePrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBasePrices,
    onSuccess: (saved) => {
      queryClient.setQueryData<RoomType[]>(roomTypesKeys.list(), (current) => mergeSaved(current, saved));
      void queryClient.invalidateQueries({ queryKey: roomTypesKeys.all });
    },
  });
}

export function useUpdateRoomPriceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, price }: { roomId: string; price: number }) => updateRoomPrice(roomId, price),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomTypesKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['manager-rooms'] });
    },
  });
}

export function useAssignRoomToTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, roomTypeId }: { roomId: string; roomTypeId: string }) =>
      assignRoomToType(roomId, roomTypeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomTypesKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['manager-rooms'] });
    },
  });
}
