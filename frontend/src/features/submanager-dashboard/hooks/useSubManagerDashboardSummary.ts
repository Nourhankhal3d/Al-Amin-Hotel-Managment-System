import { useQuery } from '@tanstack/react-query';
import {
  getSubManagerDashboardSummary,
  subManagerDashboardQueryKeys,
} from '../services/dashboard.api';

export function useSubManagerDashboardSummary() {
  return useQuery({
    queryKey: subManagerDashboardQueryKeys.summary,
    queryFn: getSubManagerDashboardSummary,
  });
}