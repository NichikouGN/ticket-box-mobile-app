export type CheckinResultType = 'SUCCESS' | 'ALREADY_USED' | 'INVALID' | 'WRONG_CONCERT';

export interface CheckinResult {
  success: boolean;
  result: CheckinResultType;
  ticketId?: string;
  userId?: string;
  concertId?: string;
  ticketTypeId?: string;
  message?: string;
}

export interface CheckinStats {
  totalTickets: number;
  checkedInTickets: number;
  remainingTickets: number;
}

export interface RawCheckinStatsResponse {
  success: boolean;
  data: {
    totalTickets: number;
    checkedInTickets: number;
    remainingTickets: number;
  };
}

