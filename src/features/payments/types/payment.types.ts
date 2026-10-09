export interface Payment {
  id: string;
  invoiceNo?: string;
  guestName?: string; // TODO: confirm with backend
  roomNo?: string;
  amount: number;
  currency?: string;
  method: string;
  status: string;
  paidAt?: string; // TODO: confirm with backend
  recordedBy?: string;
}

export interface PaymentsReportFilters {
  from?: string;
  to?: string;
  method?: string;
  status?: string;
  query?: string;
}

