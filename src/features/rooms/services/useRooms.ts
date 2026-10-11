import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoom, getRooms, getRoomStats, listRooms, roomQueryKeys, saveRoom, saveRoomActivity } from './rooms.api';
import type { RoomFilters, UpdateRoomInput, AddRoomActivityInput } from '../types/room.types';
import type { Language } from '../../../core/i18n';
import { ROOM_PAGE_SIZE } from '../constants/roomOptions';

export function useRooms(filters: RoomFilters, language: Language) {
  return useQuery({ queryKey: roomQueryKeys.list(filters, language), queryFn: () => listRooms(filters, language, ROOM_PAGE_SIZE) });
}

export function useAllRooms() {
  return useQuery({ queryKey: [...roomQueryKeys.all, 'all'], queryFn: getRooms });
}

export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: roomQueryKeys.detail(id ?? ''),
    queryFn: () => getRoom(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useRoomStats() {
  return useQuery({ queryKey: roomQueryKeys.stats(), queryFn: getRoomStats });
}

function useRoomMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: roomQueryKeys.stats() }),
        queryClient.invalidateQueries({ queryKey: roomQueryKeys.all }),
      ]);
    },
  });
}

export function useUpdateRoom() {
  return useRoomMutation<UpdateRoomInput>(saveRoom);
}

export function useAddRoomActivity() {
  return useRoomMutation<AddRoomActivityInput>(saveRoomActivity);
}
