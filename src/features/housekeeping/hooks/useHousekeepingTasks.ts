import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { housekeepingApi } from '../services/housekeeping.api';

export const housekeepingKeys = {
  all: ['housekeeping'] as const,
  tasks: () => [...housekeepingKeys.all, 'tasks'] as const,
};

export function useHousekeepingTasks() {
  return useQuery({ queryKey: housekeepingKeys.tasks(), queryFn: housekeepingApi.getTasks });
}

export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: housekeepingApi.createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}

export function useUpdateHousekeepingTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: housekeepingApi.updateTaskStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: housekeepingKeys.all }),
  });
}
