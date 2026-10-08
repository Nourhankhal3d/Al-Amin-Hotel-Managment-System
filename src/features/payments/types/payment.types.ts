export interface Payment {
  id: string;
  guestName?: string; // TODO: confirm with backend
  amount: number;
  method: string;
  status: string;
  paidAt?: string; // TODO: confirm with backend
}
