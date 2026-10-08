export interface Room {
  id: string;
  number: string;
  type?: string; // TODO: confirm with backend
  status: string;
  guestName?: string; // TODO: confirm with backend
  floor?: number; // TODO: confirm with backend
}
