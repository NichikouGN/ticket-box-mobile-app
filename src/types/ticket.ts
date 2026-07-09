export interface RawTicket {
  ticketId: string;
  concertId: string;
  ticketTypeId: string;
  status: string;
  createdAt: string;
  usedAt: string | null;
  ticketName?: string | null;
  concertDetails?: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
  } | null;
}

export interface Ticket {
  ticketId: string;
  concertId: string;
  ticketTypeId: string;
  status: string;
  createdAt: string;
  usedAt: string | null;
  ticketName?: string | null;
  concertDetails?: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
  } | null;
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

export interface TicketMeta {
  total: number;
  page: number;
  limit: number;
}

export interface TicketListResponse {
  success: boolean;
  data: RawTicket[];
  meta: TicketMeta;
}

export interface TicketDetailResponse {
  success: boolean;
  data: TicketPayload;
}

