import { useQuery } from '@tanstack/react-query';
import { roomQueryKeys } from './rooms.api';
import { getRoomExtras } from './roomExtras.api';

// React Query: saves the result under a key so the drawer doesn't refetch on every render.
// The key starts with roomQueryKeys.all, so after "save changes" it is refreshed automatically.
export function useRoomExtras(roomId: string | undefined) {
  return useQuery({
    queryKey: [...roomQueryKeys.all, 'extras', roomId ?? ''],
    queryFn: () => getRoomExtras(roomId ?? ''),
    enabled: Boolean(roomId),
  });
}