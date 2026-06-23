import { apiClient } from './api';
import { 
  BookingResponse, 
  OrderItem, 
  PaymentDetails, 
  RawBookingResponse 
} from '@/types/order';
import { storage } from '@/utils/storage';

let mockOverride: boolean | null = null;

const isMock = () => {
  if (mockOverride !== null) return mockOverride;
  return process.env.EXPO_PUBLIC_USE_MOCK === 'true';
};

// In-memory registry to map order_id to payment_id for polling resolution
const orderToPaymentMap: Record<string, string> = {};
const mockPollCounts: Record<string, number> = {};

export const orderService = {
  setMockOverride(val: boolean | null) {
    mockOverride = val;
  },

  async createOrder(items: OrderItem[], idempotencyKey: string): Promise<BookingResponse> {
    // Map items using camelCase for backend Zod schema
    const rawData = items.map(item => ({
      concertId: item.concertId,
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));

    const response = await apiClient.post<RawBookingResponse>('/orders', 
      { 
        paymentMethod: 'momo',
        data: rawData 
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        }
      }
    );

    const resData = response.data;
    const orderId = resData.data.order_id || (resData.data as any).orderId;

    // Online Mode - defensive payment_id discovery
    if (!isMock() && orderId) {
      // 1. Try to check if response data includes payment_id directly
      const responsePaymentId = (resData.data as any).payment_id || (resData.data as any).paymentId;
      if (responsePaymentId) {
        orderToPaymentMap[orderId] = responsePaymentId;
      } else {
        // 2. Fetch order history in background to locate the payment_id linked to the order
        (async () => {
          try {
            const listResponse = await apiClient.get<{ success: boolean; data: any[] }>('/orders');
            if (listResponse.data && listResponse.data.success && Array.isArray(listResponse.data.data)) {
              const matchedOrder = listResponse.data.data.find(
                (o: any) => o.id === orderId || o.order_id === orderId
              );
              if (matchedOrder) {
                const pId = matchedOrder.payment_id || matchedOrder.payment?.id || matchedOrder.paymentId;
                if (pId) {
                  orderToPaymentMap[orderId] = pId;
                }
              }
            }
          } catch (e) {
            console.warn('[Defensive Polling] Failed to retrieve user orders list in background', e);
          }
        })();
      }
    }

    return {
      success: resData.success,
      message: resData.message,
      orderId: orderId,
      totalPrice: resData.data.total_price ?? (resData.data as any).totalPrice ?? (resData.data as any).totalAmount ?? 0,
      paymentDeadline: resData.data.payment_deadline || (resData.data as any).paymentDeadline || '',
    };
  },

  async getPaymentStatus(orderOrPaymentId: string): Promise<PaymentDetails> {
    // Kịch bản chạy Local (Khi bật Mock Data)
    if (isMock()) {
      // Giả lập độ trễ mạng từ 1 đến 2 giây (delay 1-2 giây)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      if (!mockPollCounts[orderOrPaymentId]) {
        mockPollCounts[orderOrPaymentId] = 0;
      }
      mockPollCounts[orderOrPaymentId] += 1;
      const currentPoll = mockPollCounts[orderOrPaymentId];

      const status = currentPoll >= 3 ? 'SUCCESS' : 'PENDING';

      return {
        paymentId: 'mock-pay-' + orderOrPaymentId,
        orderId: orderOrPaymentId,
        status: status,
        amount: 3500000,
        paymentRef: status === 'SUCCESS' ? 'MOCK-TXN-' + Math.floor(10000000 + Math.random() * 90000000) : 'MOCK-TXN-PENDING',
        processedAt: new Date().toISOString(),
      };
    }

    // Kịch bản chạy Online (Khi kết nối Backend thật)
    let paymentId = orderToPaymentMap[orderOrPaymentId];

    // If paymentId was not resolved during createOrder background task, try resolving it here
    if (!paymentId || paymentId === orderOrPaymentId) {
      try {
        const listResponse = await apiClient.get<{ success: boolean; data: any[] }>('/orders');
        if (listResponse.data && listResponse.data.success && Array.isArray(listResponse.data.data)) {
          const matchedOrder = listResponse.data.data.find(
            (o: any) => o.id === orderOrPaymentId || o.order_id === orderOrPaymentId
          );
          if (matchedOrder) {
            const pId = matchedOrder.payment_id || matchedOrder.payment?.id || matchedOrder.paymentId || matchedOrder.payment?.payment_id;
            if (pId) {
              orderToPaymentMap[orderOrPaymentId] = pId;
              paymentId = pId;
            }
          }
        }
      } catch (e) {
        console.warn('[Defensive Polling] Failed to query user orders list', e);
      }
    }

    // Fallback if payment_id cannot be found, query using the orderId directly
    const finalQueryId = paymentId || orderOrPaymentId;

    const response = await apiClient.get<any>(`/payments/${finalQueryId}`);
    const rawData = response.data?.data || response.data;

    if (!rawData) {
      throw new Error('No payment details found in server response');
    }

    return {
      paymentId: rawData.payment_id || rawData.paymentId || finalQueryId,
      orderId: rawData.order_id || rawData.orderId || orderOrPaymentId,
      status: rawData.status || 'PENDING',
      amount: rawData.amount || 0,
      paymentRef: rawData.payment_ref || rawData.paymentRef || 'MOCK-TXN-PENDING',
      processedAt: rawData.processed_at || rawData.processedAt || new Date().toISOString(),
    };
  },

  async triggerMockPayment(orderId: string, scenario: 'success' | 'fail' | 'timeout'): Promise<any> {
    if (isMock()) {
      // Bỏ qua tương tác mạng hoàn toàn để tránh quăng lỗi 404 Axios khi offline
      return { success: true, message: `Mock scenario ${scenario} applied locally.` };
    }

    const response = await apiClient.post('/payments', {
      orderId,
      order_id: orderId,
      status: scenario === 'success' ? 'SUCCESS' : scenario === 'fail' ? 'FAILED' : 'PENDING',
      scenario: scenario,
    });
    return response.data;
  },

  subscribeOrderSSE(
    orderId: string,
    onMessage: (event: { event: string; data: any }) => void,
    onError: (err: any) => void
  ): () => void {
    let active = true;
    let xhr: XMLHttpRequest | null = null;

    (async () => {
      try {
        const token = await storage.getAccessToken();
        if (!active) return;
        
        const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
        const url = `${baseURL}/orders/${orderId}/stream`;
        
        xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Accept', 'text/event-stream');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        let lastIndex = 0;
        
        xhr.onreadystatechange = () => {
          if (!active) return;
          if (xhr && (xhr.readyState === 3 || xhr.readyState === 4)) {
            const responseText = xhr.responseText;
            if (!responseText) return;
            
            const newChunk = responseText.substring(lastIndex);
            lastIndex = responseText.length;
            
            const lines = newChunk.split('\n');
            let currentEvent = 'message';
            
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              
              if (trimmed.startsWith('event:')) {
                currentEvent = trimmed.replace('event:', '').trim();
              } else if (trimmed.startsWith('data:')) {
                const rawData = trimmed.replace('data:', '').trim();
                try {
                  const parsedData = JSON.parse(rawData);
                  onMessage({ event: currentEvent, data: parsedData });
                } catch (e) {
                  console.warn('Failed to parse SSE JSON data:', rawData, e);
                }
              }
            }
          }
        };
        
        xhr.onerror = (e) => {
          if (active) {
            onError(e);
          }
        };
        
        xhr.send();
      } catch (err) {
        if (active) {
          onError(err);
        }
      }
    })();

    return () => {
      active = false;
      if (xhr) {
        try {
          xhr.abort();
        } catch {
          // ignore
        }
      }
    };
  }
};
