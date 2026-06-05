import { apiClient } from './api';
import { RawTicket, Ticket } from '@/types/ticket';

const mapTicket = (raw: RawTicket): Ticket => ({
  ticketId: raw.ticket_id,
  concertTitle: raw.concert_title,
  eventDate: raw.event_date,
  venue: raw.venue,
  ticketType: raw.ticket_type,
  holderName: raw.holder_name,
  qrAes256: raw.qr_aes256,
  used: raw.used,
});

export const ticketService = {
  async getTickets(): Promise<Ticket[]> {
    const response = await apiClient.get<{ success: boolean; data: RawTicket[] }>('/tickets');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapTicket);
    }
    return [];
  },

  async getTicketDetail(ticketId: string): Promise<Ticket> {
    const response = await apiClient.get<{ success: boolean; data: RawTicket }>(`/tickets/${ticketId}`);
    return mapTicket(response.data.data);
  },
};
