export type CheckinResultType = 'SUCCESS' | 'ALREADY_USED' | 'INVALID' | 'WRONG_CONCERT';

export interface RawCheckinResponse {
  success: boolean;
  data: {
    result: CheckinResultType;
    ticket_id?: string;
    holder_name?: string;
    ticket_type?: string;
    checked_in_at?: string;
    used_at?: string;
    used_by_staff?: string;
    message?: string;
  };
}

export interface CheckinResult {
  success: boolean;
  result: CheckinResultType;
  ticketId?: string;
  holderName?: string;
  ticketType?: string;
  checkedInAt?: string;
  usedAt?: string;
  usedByStaff?: string;
  message?: string;
}

export interface RawCheckinStats {
  total_tickets: number;
  checked_in: number;
  scanned_tickets?: number;
  remaining: number;
  remaining_tickets?: number;
  by_ticket_type: {
    name: string;
    total: number;
    checked_in: number;
    scanned_tickets?: number;
  }[];
}

export interface CheckinStats {
  totalTickets: number;
  checkedIn: number;
  scannedTickets: number;
  remaining: number;
  remainingTickets: number;
  byTicketType: {
    name: string;
    total: number;
    checkedIn: number;
    scannedTickets: number;
  }[];
}
