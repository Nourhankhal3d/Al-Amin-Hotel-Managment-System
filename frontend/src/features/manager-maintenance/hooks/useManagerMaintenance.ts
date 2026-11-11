import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMaintenanceTicket,
  getMaintenanceTickets,
  getRooms,
  getTechnicians,
  updateMaintenanceTicket,
} from '../services/manager-maintenance.api';
import type { MaintenanceTicket, MaintenanceTicketCreate, MaintenanceTicketUpdate } from '../types/manager-maintenance.types';

export const maintenanceKeys = {
  all: ['manager-maintenance'] as const,
  tickets: () => [...maintenanceKeys.all, 'tickets'] as const,
  technicians: () => [...maintenanceKeys.all, 'technicians'] as const,
  rooms: () => [...maintenanceKeys.all, 'rooms'] as const,
};

export function useMaintenanceTickets() {
  return useQuery({ queryKey: maintenanceKeys.tickets(), queryFn: getMaintenanceTickets, staleTime: 0 });
}

export function useTechnicians() {
  return useQuery({ queryKey: maintenanceKeys.technicians(), queryFn: getTechnicians, staleTime: 5 * 60_000 });
}

/** Room numbers for the picker, plus each room's current guest for the drawer */
export function useRooms() {
  return useQuery({ queryKey: maintenanceKeys.rooms(), queryFn: getRooms, staleTime: 60_000 });
}

/** Saves a ticket and puts the saved copy in the list right away, so the row and the cards update together */
export function useUpdateMaintenanceTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MaintenanceTicketUpdate }) => updateMaintenanceTicket(id, body),
    onSuccess: (saved) => {
      queryClient.setQueryData<MaintenanceTicket[]>(maintenanceKeys.tickets(), (current) =>
        current?.map((ticket) => (ticket.id === saved.id ? saved : ticket)));
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.tickets() });
    },
  });
}

export function useCreateMaintenanceTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MaintenanceTicketCreate) => createMaintenanceTicket(body),
    onSuccess: (created) => {
      queryClient.setQueryData<MaintenanceTicket[]>(maintenanceKeys.tickets(), (current) =>
        (current ? [created, ...current] : [created]));
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.tickets() });
    },
  });
}
