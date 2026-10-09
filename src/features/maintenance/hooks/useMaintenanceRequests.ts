import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../services/maintenance.api';

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  requests: () => [...maintenanceKeys.all, 'requests'] as const,
};

export function useMaintenanceRequests() {
  return useQuery({ queryKey: maintenanceKeys.requests(), queryFn: maintenanceApi.getRequests });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceApi.createRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceApi.updateStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}
