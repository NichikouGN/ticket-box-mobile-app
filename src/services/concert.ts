import { apiClient } from './api';
import { 
  Concert, 
  ConcertListResponse, 
  ConcertTicketsResponse, 
  RawConcert, 
  RawConcertListResponse, 
  RawConcertTicketsResponse 
} from '@/types/concert';

const mapConcert = (raw: RawConcert): Concert => ({
  id: raw.id,
  title: raw.title,
  artists: raw.artists,
  venue: raw.venue,
  startTime: raw.start_time,
  status: raw.status,
  thumbnailUrl: raw.thumbnail_url,
  description: raw.description,
});

export const concertService = {
  async getConcerts(page = 1, limit = 10): Promise<ConcertListResponse> {
    const response = await apiClient.get<RawConcertListResponse>('/concerts', {
      params: { page, limit },
    });

    const rawData = response.data;
    const mappedConcerts = rawData.data.map(mapConcert);
    
    return {
      success: rawData.success,
      data: mappedConcerts,
      pagination: {
        currentPage: rawData.Pagination?.current_page || 1,
        totalPage: rawData.Pagination?.total_page || 1,
        totalItems: rawData.Pagination?.total_items || 0,
      },
    };
  },

  async getConcertDetail(id: string): Promise<Concert> {
    const response = await apiClient.get<{ success: boolean; data: RawConcert }>(`/concerts/${id}`);
    return mapConcert(response.data.data);
  },

  async getConcertTickets(id: string): Promise<ConcertTicketsResponse> {
    const response = await apiClient.get<{ success: boolean; data: RawConcertTicketsResponse }>(`/concerts/${id}/tickets`);
    const rawData = response.data.data;
    
    return {
      seatMapSvgUrl: rawData.seat_map_svg_url,
      ticketTypes: rawData.ticket_types.map(tt => ({
        id: tt.id,
        name: tt.name,
        price: tt.price,
        maxPerUser: tt.max_per_user,
        availableSeats: tt.available_seats,
      })),
    };
  },
};
