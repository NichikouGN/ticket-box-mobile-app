export interface RawTicket {
  id: string;
  concert_id: string;
  ticket_type_id: string;
  status: string;
  created_at: string;
  used_at: string | null;
}

export interface Ticket {
  ticketId: string;
  concertId: string;
  ticketTypeId: string;
  status: string;
  createdAt: string;
  usedAt: string | null;
}

export interface TicketPayload {
  ticket: {
    ticketId: string;
    userId: string;
    concertId: string;
    ticketTypeId: string;
  };
  signature: string;
}

export interface TicketListResponse {
  success: boolean;
  data: RawTicket[];
}

export interface TicketDetailResponse {
  success: boolean;
  data: TicketPayload;
}

