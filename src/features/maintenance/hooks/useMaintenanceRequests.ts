import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceRequest,
} from '../services/maintenance.api';
import type { MaintenanceIssueUpdate } from '../types/maintenance.types';

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  requests: () => [...maintenanceKeys.all, 'requests'] as const,
};

export function useMaintenanceRequests() {
  return useQuery({ queryKey: maintenanceKeys.requests(), queryFn: getMaintenanceRequests });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: NonNullable<MaintenanceIssueUpdate['status']> }) =>
      updateMaintenanceRequest(issueId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}
