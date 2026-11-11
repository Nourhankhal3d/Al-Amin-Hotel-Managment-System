import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignHousekeepingTask,
  createHousekeepingTask,
  getCleaners,
  getHousekeepingTasks,
  getRooms,
} from '../services/manager-housekeeping.api';
import type { HousekeepingTask, HousekeepingTaskAssign, HousekeepingTaskCreate } from '../types/manager-housekeeping.types';

export const housekeepingKeys = {
  all: ['manager-housekeeping'] as const,
  tasks: () => [...housekeepingKeys.all, 'tasks'] as const,
  cleaners: () => [...housekeepingKeys.all, 'cleaners'] as const,
  rooms: () => [...housekeepingKeys.all, 'rooms'] as const,
};

export function useHousekeepingTasks() {
  return useQuery({ queryKey: housekeepingKeys.tasks(), queryFn: getHousekeepingTasks, staleTime: 0 });
}

export function useCleaners() {
  return useQuery({ queryKey: housekeepingKeys.cleaners(), queryFn: getCleaners, staleTime: 5 * 60_000 });
}

/** Room numbers for the picker, plus each room's floor and guest for the table filters and the drawer */
export function useRooms() {
  return useQuery({ queryKey: housekeepingKeys.rooms(), queryFn: getRooms, staleTime: 60_000 });
}

/** Saves a task and puts the saved copy in the list right away, so the row and the cards update together */
export function useUpdateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: HousekeepingTaskAssign }) => assignHousekeepingTask(id, body),
    onSuccess: (saved) => {
      queryClient.setQueryData<HousekeepingTask[]>(housekeepingKeys.tasks(), (current) =>
        current?.map((task) => (task.id === saved.id ? saved : task)));
      void queryClient.invalidateQueries({ queryKey: housekeepingKeys.tasks() });
    },
  });
}

export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: HousekeepingTaskCreate) => createHousekeepingTask(body),
    onSuccess: (created) => {
      queryClient.setQueryData<HousekeepingTask[]>(housekeepingKeys.tasks(), (current) =>
        (current ? [created, ...current] : [created]));
      void queryClient.invalidateQueries({ queryKey: housekeepingKeys.tasks() });
    },
  });
}
