import { apiClient } from './api';
import { 
  Concert, 
  ConcertListResponse, 
  ConcertTicketsResponse, 
  RawConcert, 
  RawConcertListResponse 
} from '@/types/concert';

const mapConcert = (raw: RawConcert): Concert => {
  return {
    id: raw.id,
    title: raw.title,
    artists: raw.artists || [],
    venue: raw.venue,
    startTime: raw.eventDate || (raw as any).event_date || raw.start_time || '',
    status: raw.status,
    thumbnailUrl: raw.thumbnailUrl || raw.thumbnail_url || (raw as any).coverImage || (raw as any).cover_image || '',
    description: raw.description,
    artist: raw.artist?.name ? {
      name: raw.artist.name,
      bio: raw.artist.bio || (raw.artist as any).verified_bio || (raw.artist as any).verifiedBio || '',
    } : undefined,
  };
};

export const concertService = {
  async getConcerts(page = 1, limit = 10): Promise<ConcertListResponse> {
    const response = await apiClient.get<RawConcertListResponse>('/concerts', {
      params: { page, limit },
    });

    const rawData = response.data;
    const mappedConcerts = rawData.data.map(mapConcert);
    
    const rawPag = (rawData.Pagination || (rawData as any).pagination) as any;
    
    return {
      success: rawData.success,
      data: mappedConcerts,
      pagination: {
        currentPage: rawPag?.current_page || rawPag?.currentPage || page,
        totalPage: rawPag?.total_pages ?? rawPag?.total_page ?? rawPag?.totalPage ?? 1,
        totalItems: rawPag?.total_items ?? rawPag?.totalItems ?? mappedConcerts.length,
      },
    };
  },

  async getConcertDetail(id: string): Promise<Concert> {
    const response = await apiClient.get<{ success: boolean; data: RawConcert }>(`/concerts/${id}`);
    return mapConcert(response.data.data);
  },

  async getConcertTickets(id: string): Promise<ConcertTicketsResponse> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/concerts/${id}/ticket-types`);
    const rawData = response.data.data;
    
    // Fetch stock data from stocks API (with 's')
    let stockData: any[] = [];
    try {
      const stockResponse = await apiClient.get<{ success: boolean; data: any }>(`/concerts/${id}/stocks`);
      stockData = stockResponse.data.data || stockResponse.data || [];
    } catch (err) {
      console.warn('[Concert Service] Failed to retrieve stock data', err);
    }
    
    // The response is an array of ticket types
    const ticketTypesList = Array.isArray(rawData) ? rawData : (rawData.ticketTypes || rawData.ticket_types || []);
    const seatMapSvgUrl = rawData.seatMapSvgUrl || rawData.seat_map_svg_url || '';

    return {
      seatMapSvgUrl,
      ticketTypes: ticketTypesList.map((tt: any) => {
        const stockItem = Array.isArray(stockData) ? stockData.find((s: any) => s.id === tt.id) : null;
        const availableSeats = stockItem ? stockItem.stock : (tt.availableSeats ?? tt.available_seats ?? 0);
        return {
          id: tt.id,
          name: tt.name,
          price: tt.price,
          maxPerUser: tt.maxPerUser ?? tt.max_per_user ?? 4,
          availableSeats: availableSeats,
        };
      }),
    };
  },
};
