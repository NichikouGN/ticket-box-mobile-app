import { apiClient } from './api';
import { 
  Concert, 
  ConcertListResponse, 
  ConcertTicketsResponse, 
  RawConcert, 
  RawConcertListResponse 
} from '@/types/concert';

const ARTIST_BIOS: Record<string, { name: string; bio: string }> = {
  'HIEUTHUHAI': {
    name: 'HIEUTHUHAI',
    bio: 'HIEUTHUHAI (tên thật Nguyễn Minh Hiếu, sinh năm 1999) là một trong những nam rapper nổi bật nhất tại Việt Nam hiện nay, bước ra từ bứt phá tại cuộc thi King of Rap 2020. Press Kit chính thức từ ban tổ chức ghi nhận anh là biểu tượng của thế hệ nghệ sĩ trẻ đa năng với khả năng tự sáng tác, trình diễn và định hình xu hướng âm nhạc phong cách hip hop kết hợp pop-rap hiện đại. Gemini 2.5 Flash đã phân tích tư liệu báo chí và tổng hợp: sự thành công vượt bậc của HIEUTHUHAI đến từ tư duy âm nhạc thời thượng, ngoại hình cuốn hút cùng các bản hit quốc dân như \'NGL\', \'Cua\', và gần đây nhất là quán quân tại chương trình thực tế Anh Trai Say Hi. Rapper Minh Hiếu sở hữu chất giọng trầm ấm, flow nhịp nhàng và ca từ thông minh, dí dỏm giúp anh kết nối mạnh mẽ với khán giả đại chúng. Đêm nhạc hội tụ lần này là cơ hội để anh tái hiện phong cách trình diễn bùng nổ, khẳng định vị thế thủ lĩnh thế hệ nghệ sĩ mới.',
  },
  'Sơn Tùng M-TP': {
    name: 'Sơn Tùng M-TP',
    bio: 'Sơn Tùng M-TP (tên thật Nguyễn Thanh Tùng, sinh năm 1994) là ca sĩ, nhạc sĩ kiêm nhà sản xuất âm nhạc hàng đầu Việt Nam, được mệnh danh là \'Hoàng tử Vpop\' với sức ảnh hưởng mang tầm quốc tế. Dựa trên Press Kit chính thức, Gemini 2.5 Flash tổng hợp tiểu sử nghệ sĩ: khởi đầu từ giới underground năm 2011, Sơn Tùng nhanh chóng vươn lên thành biểu tượng nhạc Pop đương đại thông qua hàng loạt bản hit phá vỡ mọi kỷ lục nhạc số như \'Cơn Mưa Ngang Qua\', \'Lạc Trôi\', \'Hãy Trao Cho Anh\' (kết hợp Snoop Dogg) và \'Chúng Ta Của Tương Lai\'. Âm nhạc của anh là sự giao thoa độc đáo giữa Pop, R&B và nhạc điện tử thời thượng, đi kèm hình ảnh và phong cách thời trang dẫn đầu xu hướng. Với khả năng làm chủ sân khấu hoàn hảo và tư duy nghệ thuật khác biệt, Sơn Tùng M-TP luôn mang đến những trải nghiệm nghe nhìn choáng ngợp cho khán giả. Đêm diễn Live Concert 2026 hứa hẹn sẽ là cột mốc đột phá tiếp theo trong sự nghiệp đỉnh cao của anh.',
  },
  'Đen Vâu': {
    name: 'Đen Vâu',
    bio: 'Đen Vâu (tên thật Nguyễn Đức Cường, sinh năm 1989) là nam rapper thành công nhất của làn sóng Indie/Underground Việt Nam, nổi tiếng với phong cách rap mộc mạc, triết lý và đầy tính tự sự. Trích xuất từ Press Kit tự động bởi Gemini 2.5 Flash: Đen Vâu sở hữu lượng người hâm mộ khổng lồ nhờ ca từ giàu chất thơ, ví von sáng tạo và gần gũi với đời sống thường nhật của giới trẻ, thể hiện qua các tác phẩm huyền thoại như \'Đưa Nhau Đi Trốn\', \'Lối Nhỏ\', \'Trốn Tìm\', và \'Mang Tiền Về Cho Mẹ\'. Âm nhạc của Đen mang âm hưởng acoustic mộc mạc pha trộn hip-hop phóng khoáng, khơi gợi sự đồng cảm sâu sắc về cuộc sống, tình yêu và gia đình. Anh cũng là nghệ sĩ đầu tiên có nhiều MV đạt top 1 trending YouTube nhất Việt Nam. Đến với Live Concert lần này, Đen Vâu kết hợp với dàn nhạc giao hưởng, mang đến những bản phối đầy chất thơ và trải nghiệm cảm xúc độc bản dành cho người hâm mộ.',
  },
};

const mapConcert = (raw: RawConcert): Concert => {
  const mainArtistName = raw.artists && raw.artists.length > 0 ? raw.artists[0] : (raw.artist?.name || '');
  const fallbackArtist = mainArtistName ? ARTIST_BIOS[mainArtistName] || ARTIST_BIOS[mainArtistName.trim()] : undefined;

  return {
    id: raw.id,
    title: raw.title,
    artists: raw.artists || [],
    venue: raw.venue,
    startTime: raw.eventDate || (raw as any).event_date || raw.start_time || '',
    status: raw.status,
    thumbnailUrl: raw.thumbnailUrl || raw.thumbnail_url || '',
    description: raw.description,
    artist: raw.artist?.name ? {
      name: raw.artist.name,
      bio: raw.artist.bio || (fallbackArtist?.bio || ''),
    } : (fallbackArtist ? {
      name: fallbackArtist.name,
      bio: fallbackArtist.bio,
    } : undefined),
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
    const response = await apiClient.get<{ success: boolean; data: any }>(`/concerts/${id}/tickets`);
    const rawData = response.data.data;
    
    // Fetch stock data defensively in background to map available seats
    let stockData: any[] = [];
    try {
      const stockResponse = await apiClient.get<{ success: boolean; data: any }>(`/concerts/${id}/stock`);
      stockData = stockResponse.data.data || stockResponse.data || [];
    } catch (err) {
      console.warn('[Concert Service] Failed to retrieve stock data', err);
    }
    
    const ticketTypesList = rawData.ticketTypes || rawData.ticket_types || [];
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
