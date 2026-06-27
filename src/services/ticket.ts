import { apiClient } from './api';
import { RawTicket, Ticket, TicketPayload } from '@/types/ticket';

const mapTicket = (raw: RawTicket): Ticket => ({
  ticketId: raw.id,
  concertId: raw.concert_id,
  ticketTypeId: raw.ticket_type_id,
  status: raw.status,
  createdAt: raw.created_at,
  usedAt: raw.used_at,
});

export const ticketService = {
  async getTickets(): Promise<Ticket[]> {
    const response = await apiClient.get<{ success: boolean; data: RawTicket[] }>('/tickets');
    const responseData = response.data?.data || response.data || [];
    if (Array.isArray(responseData)) {
      return responseData.map(mapTicket);
    }
    return [];
  },

  async getTicketDetail(ticketId: string): Promise<TicketPayload> {
    const response = await apiClient.get<{ success: boolean; data: TicketPayload }>(`/tickets/${ticketId}`);
    // The backend returns { success: true, data: { ticket: { ticketId, userId, concertId, ticketTypeId }, signature } }
    const responseData = response.data?.data || response.data;
    if (!responseData || !responseData.ticket) {
      throw new Error('Invalid ticket detail response');
    }
    return responseData;
  },
};

