import CryptoJS from 'crypto-js';

const secretKey = process.env.EXPO_PUBLIC_QR_SECRET_KEY || 'ticketbox_secure_qr_secret_key_2026';

export interface MockUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'audience' | 'staff';
  status: 'active' | 'banned';
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'usr-1',
    email: 'user@test.com',
    password: '123456',
    fullName: 'Nguyen Van A',
    role: 'audience',
    status: 'active',
  },
  {
    id: 'usr-2',
    email: 'staff@test.com',
    password: '123456',
    fullName: 'Tran Van B',
    role: 'staff',
    status: 'active',
  },
];

export let mockUsers: MockUser[] = [...MOCK_USERS];
export let mockConcertOffsets: Record<string, number> = {};

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
  artist?: {
    name?: string;
    bio?: string;
  };
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
    artist: {
      name: 'HIEUTHUHAI',
      bio: 'HIEUTHUHAI (tên thật Nguyễn Minh Hiếu, sinh năm 1999) là một trong những nam rapper nổi bật nhất tại Việt Nam hiện nay, bước ra từ bứt phá tại cuộc thi King of Rap 2020. Press Kit chính thức từ ban tổ chức ghi nhận anh là biểu tượng của thế hệ nghệ sĩ trẻ đa năng với khả năng tự sáng tác, trình diễn và định hình xu hướng âm nhạc phong cách hip hop kết hợp pop-rap hiện đại. Gemini 2.5 Flash đã phân tích tư liệu báo chí và tổng hợp: sự thành công vượt bậc của HIEUTHUHAI đến từ tư duy âm nhạc thời thượng, ngoại hình cuốn hút cùng các bản hit quốc dân như \'NGL\', \'Cua\', và gần đây nhất là quán quân tại chương trình thực tế Anh Trai Say Hi. Rapper Minh Hiếu sở hữu chất giọng trầm ấm, flow nhịp nhàng và ca từ thông minh, dí dỏm giúp anh kết nối mạnh mẽ với khán giả đại chúng. Đêm nhạc hội tụ lần này là cơ hội để anh tái hiện phong cách trình diễn bùng nổ, khẳng định vị thế thủ lĩnh thế hệ nghệ sĩ mới.',
    },
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
    artist: {
      name: 'Sơn Tùng M-TP',
      bio: 'Sơn Tùng M-TP (tên thật Nguyễn Thanh Tùng, sinh năm 1994) là ca sĩ, nhạc sĩ kiêm nhà sản xuất âm nhạc hàng đầu Việt Nam, được mệnh danh là \'Hoàng tử Vpop\' với sức ảnh hưởng mang tầm quốc tế. Dựa trên Press Kit chính thức, Gemini 2.5 Flash tổng hợp tiểu sử nghệ sĩ: khởi đầu từ giới underground năm 2011, Sơn Tùng nhanh chóng vươn lên thành biểu tượng nhạc Pop đương đại thông qua hàng loạt bản hit phá vỡ mọi kỷ lục nhạc số như \'Cơn Mưa Ngang Qua\', \'Lạc Trôi\', \'Hãy Trao Cho Anh\' (kết hợp Snoop Dogg) và \'Chúng Ta Của Tương Lai\'. Âm nhạc của anh là sự giao thoa độc đáo giữa Pop, R&B và nhạc điện tử thời thượng, đi kèm hình ảnh và phong cách thời trang dẫn đầu xu hướng. Với khả năng làm chủ sân khấu hoàn hảo và tư duy nghệ thuật khác biệt, Sơn Tùng M-TP luôn mang đến những trải nghiệm nghe nhìn choáng ngợp cho khán giả. Đêm diễn Live Concert 2026 hứa hẹn sẽ là cột mốc đột phá tiếp theo trong sự nghiệp đỉnh cao của anh.',
    },
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
    artist: {
      name: 'Đen Vâu',
      bio: 'Đen Vâu (tên thật Nguyễn Đức Cường, sinh năm 1989) là nam rapper thành công nhất của làn sóng Indie/Underground Việt Nam, nổi tiếng với phong cách rap mộc mạc, triết lý và đầy tính tự sự. Trích xuất từ Press Kit tự động bởi Gemini 2.5 Flash: Đen Vâu sở hữu lượng người hâm mộ khổng lồ nhờ ca từ giàu chất thơ, ví von sáng tạo và gần gũi với đời sống thường nhật của giới trẻ, thể hiện qua các tác phẩm huyền thoại như \'Đưa Nhau Đi Trốn\', \'Lối Nhỏ\', \'Trốn Tìm\', và \'Mang Tiền Về Cho Mẹ\'. Âm nhạc của Đen mang âm hưởng acoustic mộc mạc pha trộn hip-hop phóng khoáng, khơi gợi sự đồng cảm sâu sắc về cuộc sống, tình yêu và gia đình. Anh cũng là nghệ sĩ đầu tiên có nhiều MV đạt top 1 trending YouTube nhất Việt Nam. Đến với Live Concert lần này, Đen Vâu kết hợp với dàn nhạc giao hưởng, mang đến những bản phối đầy chất thơ và trải nghiệm cảm xúc độc bản dành cho người hâm mộ.',
    },
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
export let mockTickets: MockTicket[] = [];

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
  // Normalize path and method
  const path = url.replace(/^\/?api\/v1/, '').split('?')[0];
  const normalizedMethod = method.toUpperCase();

  // Auth logins
  if ((path === '/auth/login' || path === '/users/sign-in' || path === '/auth/sign-in') && normalizedMethod === 'POST') {
    const userEmail = body?.email || body?.username || '';
    const userPassword = body?.password || '';

    const matchedUser = mockUsers.find(
      u => u.email.toLowerCase() === userEmail.toLowerCase() && u.password === userPassword
    );

    if (!matchedUser) {
      return {
        status: 401,
        data: {
          success: false,
          message: 'Tài khoản hoặc mật khẩu không chính xác!',
        },
      };
    }

    const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const payloadObj = {
      sub: matchedUser.id,
      userId: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role.toUpperCase(),
      app_metadata: { role: matchedUser.role },
      user_metadata: { full_name: matchedUser.fullName }
    };
    const payloadBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(payloadObj)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const dynamicToken = `${header}.${payloadBase64}.mock_signature`;

    return {
      status: 200,
      data: {
        success: true,
        accessToken: dynamicToken,
        access_token: dynamicToken,
        refreshToken: 'mock-refresh-token-jwt',
        refresh_token: 'mock-refresh-token-jwt',
        user: {
          id: matchedUser.id,
          email: matchedUser.email,
          full_name: matchedUser.fullName,
          fullName: matchedUser.fullName,
          role: matchedUser.role,
          status: matchedUser.status,
        },
      },
    };
  }

  // Register (Sign-up)
  if ((path === '/auth/register' || path === '/users/sign-up' || path === '/auth/sign-up') && normalizedMethod === 'POST') {
    const regEmail = body?.email || body?.username || '';
    const regPassword = body?.password || '';
    const regFullName = body?.fullName || body?.full_name || 'New Audience User';

    if (!regEmail || !regPassword) {
      return {
        status: 400,
        data: {
          success: false,
          message: 'Vui lòng nhập đầy đủ email và mật khẩu.',
        },
      };
    }

    const exists = mockUsers.some(u => u.email.toLowerCase() === regEmail.toLowerCase());
    if (exists) {
      return {
        status: 400,
        data: {
          success: false,
          message: 'Email này đã được sử dụng!',
        },
      };
    }

    mockUsers.push({
      id: 'usr-' + mockUUID(),
      email: regEmail,
      password: regPassword,
      fullName: regFullName,
      role: 'audience',
      status: 'active',
    });

    return {
      status: 201,
      data: {
        success: true,
        message: 'Đăng ký thành công!',
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
  if (path === '/orders' && normalizedMethod === 'POST') {
    const items = body?.data || [];
    if (items.length === 0) {
      return { status: 400, data: { success: false, message: 'No items selected' } };
    }

    const orderId = 'ord-' + mockUUID();
    const deadline = new Date(Date.now() + 600000).toISOString(); // 10 minutes deadline
    let totalPrice = 0;
    const pendingTickets: MockTicket[] = [];

    // Find concert supporting both camelCase and snake_case
    const concertId = items[0].concertId || items[0].concert_id;
    const concert = MOCK_CONCERTS.find(c => c.id === concertId);
    const concertTitle = concert?.title || 'Concert Event';
    const eventDate = concert?.start_time || new Date().toISOString();
    const venue = concert?.venue || 'Venue Location';

    items.forEach((item: any) => {
      const typeList = MOCK_TICKET_TYPES[concertId] || [];
      const ticketTypeId = item.ticketTypeId || item.ticket_type_id;
      const ticketTypeObj = typeList.find(t => t.id === ticketTypeId);
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
  if (path === '/payments' && normalizedMethod === 'POST') {
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
  if (path === '/checkin/verify' && normalizedMethod === 'POST') {
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
          result: 'INVALID',
          message: 'Mã QR không tồn tại trong hệ thống.',
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
          result: 'WRONG_CONCERT',
          message: 'Vé này không thuộc concert đang diễn ra.',
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
          result: 'ALREADY_USED',
          used_at: matchedTicket.used_at || new Date().toISOString(),
          used_by_staff: matchedTicket.used_by_staff || 'Staff Mock Portal',
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
        result: 'SUCCESS',
        ticket_id: matchedTicket.ticket_id,
        holder_name: matchedTicket.holder_name,
        ticket_type: matchedTicket.ticket_type,
        checked_in_at: matchedTicket.used_at,
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

    // Increment mock offsets to simulate background entries
    if (!mockConcertOffsets[concertId]) {
      mockConcertOffsets[concertId] = 0;
    }
    mockConcertOffsets[concertId] += Math.floor(Math.random() * 3) + 1;
    const offset = mockConcertOffsets[concertId];

    // Compute stats from MOCK_TICKET_TYPES and mockTickets
    const types = MOCK_TICKET_TYPES[concertId] || [];
    let totalTickets = 0;
    let checkedIn = 0;

    const byTicketType = types.map((t, idx) => {
      // Find sold tickets for this type
      const soldTickets = mockTickets.filter(mt => mt.concert_id === concertId && mt.ticket_type === t.name);
      const ticketTotal = soldTickets.length + t.available_seats; // total is sold + remaining available

      let ticketCheckedIn = soldTickets.filter(mt => mt.used).length;

      // Add simulated entries, making sure it doesn't exceed the total seats
      const simulatedExtra = Math.min(
        offset + (idx * 3),
        t.available_seats
      );
      ticketCheckedIn += simulatedExtra;

      totalTickets += ticketTotal;
      checkedIn += ticketCheckedIn;

      return {
        name: t.name,
        total: ticketTotal,
        checked_in: ticketCheckedIn,
        scanned_tickets: ticketCheckedIn,
      };
    });

    return {
      status: 200,
      data: {
        success: true,
        data: {
          total_tickets: totalTickets,
          checked_in: checkedIn,
          scanned_tickets: checkedIn,
          remaining: totalTickets - checkedIn,
          remaining_tickets: totalTickets - checkedIn,
          by_ticket_type: byTicketType
        }
      }
    };
  }

  return {
    status: 404,
    data: {
      success: false,
      message: `API Route Mock Not Found: [${normalizedMethod}] ${path}`
    }
  };
};
