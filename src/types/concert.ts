export interface Artist {
  id: string;
  name: string;
  verifiedBio: string | null;
}

export interface Concert {
  id: string;
  title: string;
  artists: Artist[];
  venue: string;
  startTime: string;
  status: string;
  thumbnailUrl: string;
  description?: string;
  artist?: {
    name?: string;
    bio?: string;
  };
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  maxPerUser: number;
  availableSeats: number;
}

export interface ConcertTicketsResponse {
  seatMapSvgUrl: string;
  ticketTypes: TicketType[];
}

export interface Pagination {
  currentPage: number;
  totalPage: number;
  totalItems: number;
}

export interface ConcertListResponse {
  success: boolean;
  data: Concert[];
  pagination: Pagination;
}

// Raw backend structures
export interface RawConcert {
  id: string;
  title: string;
  artists: (string | Artist)[];
  venue: string;
  start_time?: string;
  eventDate?: string;
  status: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  description?: string;
  artist?: {
    name?: string;
    bio?: string;
  };
}

export interface RawTicketType {
  id: string;
  name: string;
  price: number;
  max_per_user: number;
  available_seats: number;
}

export interface RawConcertTicketsResponse {
  seat_map_svg_url: string;
  ticket_types: RawTicketType[];
}

export interface RawConcertListResponse {
  success: boolean;
  data: RawConcert[];
  Pagination: {
    current_page: number;
    total_page: number;
    total_items: number;
  };
}
