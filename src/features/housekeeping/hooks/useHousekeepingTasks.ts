import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createHousekeepingTask, getHousekeepingTasks, updateHousekeepingTask } from '../services/housekeeping.api';

export const housekeepingKeys = {
  all: ['housekeeping'] as const,
  tasks: () => [...housekeepingKeys.all, 'tasks'] as const,
};

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
    mutationFn: (taskId: number) => updateHousekeepingTask(taskId, { status: 'done' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}
