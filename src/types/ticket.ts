export interface RawTicket {
  ticket_id: string;
  concert_title: string;
  event_date: string;
  venue: string;
  ticket_type: string;
  holder_name: string;
  qr_aes256?: string;
  qr_raw?: string;
  used: boolean;
}

export interface Ticket {
  ticketId: string;
  concertTitle: string;
  eventDate: string;
  venue: string;
  ticketType: string;
  holderName: string;
  qrAes256: string;
  used: boolean;
}

export interface TicketListResponse {
  success: boolean;
  data: Ticket[];
}

export interface TicketDetailResponse {
  success: boolean;
  data: Ticket;
}
