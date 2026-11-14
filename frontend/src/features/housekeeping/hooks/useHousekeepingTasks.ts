import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createHousekeepingTask, getHousekeepingTasks, getRoomNumbers, updateHousekeepingTask } from '../services/housekeeping.api';
import type { Priority } from '../types/housekeeping.types';

export const housekeepingKeys = {
  all: ['housekeeping'] as const,
  tasks: () => [...housekeepingKeys.all, 'tasks'] as const,
  rooms: () => [...housekeepingKeys.all, 'rooms'] as const,
};

// Rooms rarely change during a shift, so the list is cached for a few minutes
export function useRoomNumbers() {
  return useQuery({ queryKey: housekeepingKeys.rooms(), queryFn: getRoomNumbers, staleTime: 5 * 60_000 });
}

export function useHousekeepingTasks() {
  return useQuery({ queryKey: housekeepingKeys.tasks(), queryFn: getHousekeepingTasks });
}

export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHousekeepingTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}

// The only status change the receptionist can make: pending -> done
export function useCompleteHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string | number) => updateHousekeepingTask(taskId, { status: 'done' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}

// Writes the cleaner's name on a pending task (the PATCH sends only cleaner_name)
export function useAssignCleaner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, cleanerName }: { taskId: string | number; cleanerName: string }) =>
      updateHousekeepingTask(taskId, { cleaner_name: cleanerName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}

// Changes the priority of a pending task (the PATCH sends only priority)
export function useChangeTaskPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, priority }: { taskId: string | number; priority: Priority }) =>
      updateHousekeepingTask(taskId, { priority }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}