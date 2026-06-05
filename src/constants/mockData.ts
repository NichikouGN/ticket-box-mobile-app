import CryptoJS from 'crypto-js';

const secretKey = process.env.EXPO_PUBLIC_QR_SECRET_KEY || 'ticketbox_secure_qr_secret_key_2026';

// Interfaces matching backend raw formats
export interface MockConcert {
  id: string;
  title: string;
  artists: string[];
  venue: string;
  start_time: string;
  status: string;
  thumbnail_url: string;
  description: string;
}

export interface MockTicketType {
  id: string;
  name: string;
  price: number;
  max_per_user: number;
  available_seats: number;
}

export interface MockTicket {
  ticket_id: string;
  concert_id: string;
  concert_title: string;
  event_date: string;
  venue: string;
  ticket_type: string;
  holder_name: string;
  qr_raw: string;
  qr_aes256: string;
  used: boolean;
  used_at?: string;
  used_by_staff?: string;
}

export interface MockOrder {
  order_id: string;
  concert_id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  target_status: 'SUCCESS' | 'FAILED';
  poll_count: number;
  payment_ref?: string;
  tickets: MockTicket[];
}

// In-Memory Database State
export const MOCK_CONCERTS: MockConcert[] = [
  {
    id: 'concert-1',
    title: 'Anh Trai Say Hi - Đêm Hội Tụ',
    artists: ['HIEUTHUHAI', 'RHYDER', 'Negav', 'Quang Hùng MasterD', 'Anh Tú Atus'],
    venue: 'Sân vận động Quân khu 7, TP. Hồ Chí Minh',
    start_time: '2026-07-15T18:00:00Z',
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
    description: 'Đêm nhạc hội tụ của những anh trai xuất sắc nhất chương trình truyền hình thực tế hot nhất mùa hè. Trải nghiệm âm thanh đỉnh cao cùng các màn trình diễn dàn dựng AI công phu.',
  },
  {
    id: 'concert-2',
    title: 'Sơn Tùng M-TP - Live Concert 2026',
    artists: ['Sơn Tùng M-TP'],
    venue: 'Sân vận động Mỹ Đình, Hà Nội',
    start_time: '2026-08-22T19:00:00Z',
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=600&auto=format&fit=crop',
    description: 'Sân khấu độc bản đánh dấu sự trở lại hoành tráng của nghệ sĩ hàng đầu Việt Nam. Một bữa tiệc nghệ thuật đầy bất ngờ kết hợp công nghệ ánh sáng hiện đại nhất.',
  },
  {
    id: 'concert-3',
    title: 'Đen Vâu - Show Của Đen',
    artists: ['Đen Vâu', 'JustaTee', 'Vũ'],
    venue: 'Trung tâm Hội chợ và Triển lãm Sài Gòn (SECC), TP. HCM',
    start_time: '2026-09-05T19:30:00Z',
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    description: 'Đêm tự sự mộc mạc và gần gũi với những bản hit quốc dân cùng dàn nhạc giao hưởng cổ điển kết hợp rap độc đáo.',
  },
];

export const MOCK_TICKET_TYPES: Record<string, MockTicketType[]> = {
  'concert-1': [
    { id: 'c1-svip', name: 'SVIP Zone', price: 4500000, max_per_user: 2, available_seats: 120 },
    { id: 'c1-vip', name: 'VIP Zone', price: 2800000, max_per_user: 4, available_seats: 340 },
    { id: 'c1-ga', name: 'GA (Standing)', price: 1200000, max_per_user: 6, available_seats: 1200 },
  ],
  'concert-2': [
    { id: 'c2-svip', name: 'VVIP Fanzone', price: 5500000, max_per_user: 2, available_seats: 80 },
    { id: 'c2-vip', name: 'VIP Cabin', price: 3500000, max_per_user: 4, available_seats: 250 },
    { id: 'c2-ga', name: 'GA Standard', price: 1500000, max_per_user: 6, available_seats: 2500 },
  ],
  'concert-3': [
    { id: 'c3-vip', name: 'VIP Đen', price: 3000000, max_per_user: 4, available_seats: 150 },
    { id: 'c3-ga', name: 'GA Đồng Âm', price: 1000000, max_per_user: 6, available_seats: 1800 },
  ],
};

// Global DB variables holding dynamic purchases during active run
let mockOrders: MockOrder[] = [];
let mockTickets: MockTicket[] = [];

// Helper helper function to generate UUID
const mockUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Seed 2 initial tickets so wallet list isn't empty on startup
const seedInitialTickets = () => {
  if (mockTickets.length > 0) return;

  const raw1 = 'ticket-seed-raw-unused-uuid-11111';
  const aes1 = CryptoJS.AES.encrypt(raw1, secretKey).toString();
  mockTickets.push({
    ticket_id: 'tkt-seed-1',
    concert_id: 'concert-1',
    concert_title: 'Anh Trai Say Hi - Đêm Hội Tụ',
    event_date: '2026-07-15T18:00:00Z',
    venue: 'Sân vận động Quân khu 7, TP. Hồ Chí Minh',
    ticket_type: 'SVIP Zone',
    holder_name: 'Khán Giả Demo',
    qr_raw: raw1,
    qr_aes256: aes1,
    used: false,
  });

  const raw2 = 'ticket-seed-raw-used-uuid-22222';
  const aes2 = CryptoJS.AES.encrypt(raw2, secretKey).toString();
  mockTickets.push({
    ticket_id: 'tkt-seed-2',
    concert_id: 'concert-2',
    concert_title: 'Sơn Tùng M-TP - Live Concert 2026',
    event_date: '2026-08-22T19:00:00Z',
    venue: 'Sân vận động Mỹ Đình, Hà Nội',
    ticket_type: 'VIP Cabin',
    holder_name: 'Khán Giả Demo',
    qr_raw: raw2,
    qr_aes256: aes2,
    used: true,
    used_at: new Date(Date.now() - 3600000).toISOString(),
    used_by_staff: 'Staff Nguyễn Văn B',
  });
};

// Initialize seeding
seedInitialTickets();

// Main handler routing mock requests
export const handleMockRequest = async (url: string, method: string, body?: any): Promise<{ status: number; data: any }> => {
  // Normalize path
  const path = url.replace(/^\/api\/v1/, '').split('?')[0];

  // Auth logins
  if (path === '/auth/login' || path === '/users/sign-in') {
    return {
      status: 200,
      data: {
        success: true,
        access_token: 'mock-access-token-jwt',
        refresh_token: 'mock-refresh-token-jwt',
      },
    };
  }

  // Concert list
  if (path === '/concerts') {
    return {
      status: 200,
      data: {
        success: true,
        data: MOCK_CONCERTS,
        Pagination: {
          current_page: 1,
          total_page: 1,
          total_items: MOCK_CONCERTS.length,
        },
      },
    };
  }

  // Concert detail
  const concertDetailMatch = path.match(/^\/concerts\/([a-zA-Z0-9-]+)$/);
  if (concertDetailMatch) {
    const id = concertDetailMatch[1];
    const concert = MOCK_CONCERTS.find(c => c.id === id);
    if (!concert) return { status: 404, data: { success: false, message: 'Concert not found' } };
    return {
      status: 200,
      data: {
        success: true,
        data: concert,
      },
    };
  }

  // Concert tickets selection map
  const concertTicketsMatch = path.match(/^\/concerts\/([a-zA-Z0-9-]+)\/tickets$/);
  if (concertTicketsMatch) {
    const id = concertTicketsMatch[1];
    const types = MOCK_TICKET_TYPES[id] || [];
    return {
      status: 200,
      data: {
        success: true,
        data: {
          seat_map_svg_url: 'https://ticketbox.vn/layouts/mock-seatmap.svg',
          ticket_types: types,
        },
      },
    };
  }

  // Orders creation
  if (path === '/orders' && method === 'POST') {
    const items = body?.data || [];
    if (items.length === 0) {
      return { status: 400, data: { success: false, message: 'No items selected' } };
    }

    const orderId = 'ord-' + mockUUID();
    const deadline = new Date(Date.now() + 600000).toISOString(); // 10 minutes deadline
    let totalPrice = 0;
    const pendingTickets: MockTicket[] = [];

    // Find concert
    const concertId = items[0].concert_id;
    const concert = MOCK_CONCERTS.find(c => c.id === concertId);
    const concertTitle = concert?.title || 'Concert Event';
    const eventDate = concert?.start_time || new Date().toISOString();
    const venue = concert?.venue || 'Venue Location';

    items.forEach((item: any) => {
      const typeList = MOCK_TICKET_TYPES[concertId] || [];
      const ticketTypeObj = typeList.find(t => t.id === item.ticket_type_id);
      if (ticketTypeObj) {
        totalPrice += ticketTypeObj.price * item.quantity;

        // Generate tickets pending success payment
        for (let i = 0; i < item.quantity; i++) {
          const qrRaw = mockUUID();
          // Encrypt with actual secret key so app can decrypt it later
          const qrAes256 = CryptoJS.AES.encrypt(qrRaw, secretKey).toString();

          pendingTickets.push({
            ticket_id: 'tkt-' + mockUUID(),
            concert_id: concertId,
            concert_title: concertTitle,
            event_date: eventDate,
            venue: venue,
            ticket_type: ticketTypeObj.name,
            holder_name: 'Khán Giả Mua Vé',
            qr_raw: qrRaw,
            qr_aes256: qrAes256,
            used: false,
          });
        }
      }
    });

    const newOrder: MockOrder = {
      order_id: orderId,
      concert_id: concertId,
      status: 'PENDING',
      amount: totalPrice,
      target_status: 'SUCCESS',
      poll_count: 0,
      tickets: pendingTickets,
    };

    mockOrders.push(newOrder);

    return {
      status: 200,
      data: {
        success: true,
        message: 'Vé đã được đặt giữ tạm thời',
        data: {
          order_id: orderId,
          total_price: totalPrice,
          payment_deadline: deadline,
        },
      },
    };
  }

  // Payments trigger (mock payment gateway screen action)
  if (path === '/payments' && method === 'POST') {
    const orderId = body?.order_id || body?.orderId;
    const targetStatusInput = body?.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
    const scenario = body?.scenario || 'success';

    const order = mockOrders.find(o => o.order_id === orderId);
    if (!order) return { status: 404, data: { success: false, message: 'Order not found' } };

    order.target_status = targetStatusInput;
    order.poll_count = 0;
    
    if (scenario === 'fail') {
      order.status = 'FAILED';
    }

    return {
      status: 200,
      data: {
        success: true,
        message: `Đã thiết lập kịch bản thanh toán: ${scenario.toUpperCase()}`,
      },
    };
  }

  // Payments polling verify status
  const paymentMatch = path.match(/^\/payments\/([a-zA-Z0-9-]+)$/);
  if (paymentMatch) {
    const orderId = paymentMatch[1];
    const order = mockOrders.find(o => o.order_id === orderId);
    if (!order) return { status: 404, data: { success: false, message: 'Order/Payment not found' } };

    order.poll_count += 1;

    // Simulate network polling delays: returns SUCCESS/FAILED after 3 requests
    if (order.poll_count >= 3) {
      if (order.target_status === 'SUCCESS' && order.status !== 'SUCCESS') {
        order.status = 'SUCCESS';
        order.payment_ref = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
        // Payment success -> activate and push tickets to user's wallet database
        order.tickets.forEach(t => {
          mockTickets.push(t);
        });
      } else if (order.target_status === 'FAILED') {
        order.status = 'FAILED';
      }
    }

    return {
      status: 200,
      data: {
        success: true,
        data: {
          payment_id: 'pay-' + mockUUID(),
          order_id: order.order_id,
          status: order.status,
          amount: order.amount,
          payment_ref: order.payment_ref || 'MOCK-TXN-PENDING',
          processed_at: order.status === 'PENDING' ? null : new Date().toISOString(),
        },
      },
    };
  }

  // User tickets list
  if (path === '/tickets') {
    return {
      status: 200,
      data: {
        success: true,
        data: mockTickets,
      },
    };
  }

  // User ticket detail
  const ticketDetailMatch = path.match(/^\/tickets\/([a-zA-Z0-9-]+)$/);
  if (ticketDetailMatch) {
    const ticketId = ticketDetailMatch[1];
    const ticket = mockTickets.find(t => t.ticket_id === ticketId);
    if (!ticket) return { status: 404, data: { success: false, message: 'Ticket not found' } };
    return {
      status: 200,
      data: {
        success: true,
        data: ticket,
      },
    };
  }

  // Staff check-in verification
  if (path === '/checkin/verify' && method === 'POST') {
    const qrSha256 = body?.qr_sha256;
    const concertId = body?.concert_id;

    if (!qrSha256 || !concertId) {
      return { status: 400, data: { success: false, message: 'Missing qr_sha256 or concert_id' } };
    }

    // Search in mockTickets matching computed hash of qr_raw
    let matchedTicket: MockTicket | null = null;
    for (const t of mockTickets) {
      const computedHash = CryptoJS.SHA256(t.qr_raw).toString(CryptoJS.enc.Hex);
      if (computedHash === qrSha256) {
        matchedTicket = t;
        break;
      }
    }

    if (!matchedTicket) {
      return {
        status: 200,
        data: {
          success: false,
          data: {
            result: 'INVALID',
            message: 'Mã QR không tồn tại trong hệ thống.'
          }
        }
      };
    }

    // Check wrong concert
    if (matchedTicket.concert_id !== concertId) {
      return {
        status: 200,
        data: {
          success: false,
          data: {
            result: 'WRONG_CONCERT',
            message: 'Vé này không thuộc concert đang diễn ra.'
          }
        }
      };
    }

    // Check already used
    if (matchedTicket.used) {
      return {
        status: 200,
        data: {
          success: false,
          data: {
            result: 'ALREADY_USED',
            used_at: matchedTicket.used_at || new Date().toISOString(),
            used_by_staff: matchedTicket.used_by_staff || 'Staff Mock Portal'
          }
        }
      };
    }

    // Mark as checked in
    matchedTicket.used = true;
    matchedTicket.used_at = new Date().toISOString();
    matchedTicket.used_by_staff = 'Mock Check-in Device';

    return {
      status: 200,
      data: {
        success: true,
        data: {
          result: 'SUCCESS',
          ticket_id: matchedTicket.ticket_id,
          holder_name: matchedTicket.holder_name,
          ticket_type: matchedTicket.ticket_type,
          checked_in_at: matchedTicket.used_at
        }
      }
    };
  }

  // Staff checkin stats
  const statsMatch = path.match(/^\/checkin\/stats\/([a-zA-Z0-9-]+)$/);
  if (statsMatch) {
    const concertId = statsMatch[1];
    
    // Compute stats from MOCK_TICKET_TYPES and mockTickets
    const types = MOCK_TICKET_TYPES[concertId] || [];
    let totalTickets = 0;
    let checkedIn = 0;

    const byTicketType = types.map(t => {
      // Find sold tickets for this type
      const soldTickets = mockTickets.filter(mt => mt.concert_id === concertId && mt.ticket_type === t.name);
      const ticketTotal = soldTickets.length + t.available_seats; // total is sold + remaining available
      const ticketCheckedIn = soldTickets.filter(mt => mt.used).length;
      
      totalTickets += ticketTotal;
      checkedIn += ticketCheckedIn;

      return {
        name: t.name,
        total: ticketTotal,
        checked_in: ticketCheckedIn
      };
    });

    return {
      status: 200,
      data: {
        success: true,
        data: {
          total_tickets: totalTickets,
          checked_in: checkedIn,
          remaining: totalTickets - checkedIn,
          by_ticket_type: byTicketType
        }
      }
    };
  }

  return { status: 404, data: { success: false, message: 'API Route Mock Not Found' } };
};
