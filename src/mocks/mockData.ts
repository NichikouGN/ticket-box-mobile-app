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

export const MOCK_CONCERTS: MockConcert[] = [
  {
    id: 'concert-1',
    title: 'Anh Trai Say Hi - Đêm Hội Tụ',
    artists: ['HIEUTHUHAI', 'RHYDER', 'Negav', 'Quang Hùng MasterD', 'Anh Tú Atus'],
    venue: 'Sân vận động Quân khu 7, TP. Hồ Chí Minh',
    start_time: '2026-07-15T18:00:00Z',
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
    description: 'Đêm nhạc hội tụ của những anh trai xuất sắc nhất chương trình truyền hình thực tế hot nhất mùa hè.',
    artist: {
      name: 'HIEUTHUHAI',
      bio: 'Tiểu sử ca sĩ rapper HIEUTHUHAI...',
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
    description: 'Live concert hoành tráng kỷ niệm chặng đường âm nhạc.',
    artist: {
      name: 'Sơn Tùng M-TP',
      bio: 'Tiểu sử nghệ sĩ Sơn Tùng M-TP...',
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
};

export let mockOrders: MockOrder[] = [];
export let mockTickets: MockTicket[] = [];

const mockUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
};

seedInitialTickets();

export const handleMockRequest = async (url: string, method: string, body?: any): Promise<{ status: number; data: any }> => {
  const path = url.replace(/^\/?api\/v1/, '').split('?')[0];
  const normalizedMethod = method.toUpperCase();

  // Auth login
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
          fullName: matchedUser.fullName,
          role: matchedUser.role,
          status: matchedUser.status,
        },
      },
    };
  }

  // Register
  if ((path === '/auth/register' || path === '/users/sign-up' || path === '/auth/sign-up') && normalizedMethod === 'POST') {
    const regEmail = body?.email || body?.username || '';
    const regPassword = body?.password || '';
    const regFullName = body?.fullName || body?.full_name || 'New User';

    const exists = mockUsers.some(u => u.email.toLowerCase() === regEmail.toLowerCase());
    if (exists) {
      return {
        status: 400,
        data: { success: false, message: 'Email này đã được sử dụng!' }
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
      data: { success: true, message: 'Đăng ký thành công!' }
    };
  }

  // Concert list
  if (path === '/concerts') {
    return {
      status: 200,
      data: {
        success: true,
        data: MOCK_CONCERTS,
        pagination: {
          currentPage: 1,
          totalPage: 1,
          totalItems: MOCK_CONCERTS.length,
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

  // Concert ticket-types & stocks mapping (aligns with real backend)
  const ticketTypesMatch = path.match(/^\/concerts\/([a-zA-Z0-9-]+)\/ticket-types$/);
  if (ticketTypesMatch) {
    const id = ticketTypesMatch[1];
    const types = MOCK_TICKET_TYPES[id] || [];
    return {
      status: 200,
      data: {
        success: true,
        data: types,
      },
    };
  }

  const stocksMatch = path.match(/^\/concerts\/([a-zA-Z0-9-]+)\/stocks$/);
  if (stocksMatch) {
    const id = stocksMatch[1];
    const types = MOCK_TICKET_TYPES[id] || [];
    const stocks = types.map(t => ({
      id: t.id,
      name: t.name,
      stock: t.available_seats,
    }));
    return {
      status: 200,
      data: {
        success: true,
        data: stocks,
      },
    };
  }

  // User tickets list
  if (path === '/tickets') {
    // Map mockTickets to raw tickets format returned by backend (without detail joins)
    const rawTickets = mockTickets.map(t => ({
      ticketId: t.ticket_id,
      concertId: t.concert_id,
      ticketTypeId: 'c1-svip', // Mock a type UUID
      status: t.used ? 'USED' : 'UNUSED',
      createdAt: new Date().toISOString(),
    }));
    return {
      status: 200,
      data: {
        success: true,
        data: rawTickets,
      },
    };
  }

  // User ticket detail
  const ticketDetailMatch = path.match(/^\/tickets\/([a-zA-Z0-9-]+)$/);
  if (ticketDetailMatch) {
    const ticketId = ticketDetailMatch[1];
    const ticket = mockTickets.find(t => t.ticket_id === ticketId);
    if (!ticket) return { status: 404, data: { success: false, message: 'Ticket not found' } };
    // Format payload as { ticket: { ticketId, userId, concertId, ticketTypeId }, signature: "Base64" }
    const payload = {
      ticket: {
        ticketId: ticket.ticket_id,
        userId: 'usr-1',
        concertId: ticket.concert_id,
        ticketTypeId: 'c1-svip',
      },
      signature: 'MOCK_SIGNATURE_ED25519_BASE64_VAL',
    };
    return {
      status: 200,
      data: payload,
    };
  }

  // Checkin public key
  if (path === '/checkin/public-key') {
    return {
      status: 200,
      data: {
        publicKey: '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAGb9ECWmEzf6fqZbYi9wQMbXp\n-----END PUBLIC KEY-----',
      },
    };
  }

  // Checkin verify
  if (path === '/checkin/verify' && normalizedMethod === 'POST') {
    const { ticketId, userId, concertId, ticketTypeId } = body || {};
    if (!ticketId || !concertId) {
      return { status: 400, data: { message: 'Missing checkin fields' } };
    }
    // Simulate checkin: 409 already used, 404 invalid, 200 ok
    if (ticketId.includes('used')) {
      return { status: 409, data: { message: 'Ticket already checked in' } };
    }
    if (ticketId.includes('invalid')) {
      return { status: 404, data: { message: 'Ticket not found' } };
    }
    return {
      status: 200,
      data: { success: true, message: 'Verify check-in success' }
    };
  }

  // Checkin stats
  const statsMatch = path.match(/^\/checkin\/stats\/([a-zA-Z0-9-]+)$/);
  if (statsMatch) {
    return {
      status: 200,
      data: {
        success: true,
        data: {
          totalTickets: 1540,
          checkedInTickets: 680,
          remainingTickets: 860,
        },
      },
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
