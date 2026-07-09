import { apiClient } from './api';
import { RawTicket, Ticket, TicketPayload, TicketListResponse, TicketMeta } from '@/types/ticket';

const mapTicket = (raw: RawTicket): Ticket => ({
  ticketId: raw.ticketId,
  concertId: raw.concertId,
  ticketTypeId: raw.ticketTypeId,
  status: raw.status,
  createdAt: raw.createdAt,
  usedAt: raw.usedAt,
  ticketName: raw.ticketName || null,
  concertDetails: raw.concertDetails ? {
    id: raw.concertDetails.id,
    title: raw.concertDetails.title,
    venue: raw.concertDetails.venue,
    eventDate: raw.concertDetails.eventDate,
  } : null,
});

export const ticketService = {
  async getTickets(page = 1, limit = 100): Promise<{ tickets: Ticket[]; meta: TicketMeta | null }> {
    const response = await apiClient.get<TicketListResponse>('/tickets', {
      params: { page, limit }
    });
    const responseData = response.data?.data || [];
    const meta = response.data?.meta || null;

    return {
      tickets: Array.isArray(responseData) ? responseData.map(mapTicket) : [],
      meta
    };
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

