import { apiClient } from './api';
import { 
  BookingResponse, 
  OrderItem, 
  RawBookingResponse,
  PaymentUrlEvent,
  OrderConfirmEvent
} from '@/types/order';
import { storage } from '@/utils/storage';

export const orderService = {
  async createOrder(items: OrderItem[], idempotencyKey: string): Promise<BookingResponse> {
    const rawData = items.map(item => ({
      concertId: item.concertId,
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));

    const response = await apiClient.post<RawBookingResponse>('/orders', 
      { 
        paymentMethod: 'stripe',
        data: rawData 
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        }
      }
    );

    const resData = response.data?.data || response.data;
    if (!resData) {
      throw new Error('Đơn hàng không hợp lệ từ máy chủ');
    }

    return {
      success: true,
      message: response.data?.message || 'Giữ vé thành công.',
      orderId: resData.orderId,
      totalPrice: resData.totalPrice,
      paymentDeadline: resData.paymentDeadline,
      paymentUrl: resData.paymentUrl,
    };
  },

  subscribePaymentUrlSSE(
    orderId: string,
    onPaymentUrl: (data: PaymentUrlEvent) => void,
    onError: (err: any) => void
  ): () => void {
    let active = true;
    let xhr: XMLHttpRequest | null = null;

    (async () => {
      try {
        const token = await storage.getAccessToken();
        if (!active) return;
        
        const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
        const url = `${baseURL}/orders/${orderId}/stream/payment-url`;
        
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
                  if (currentEvent === 'ORDER_UPDATED' || currentEvent === 'message') {
                    onPaymentUrl(parsedData as PaymentUrlEvent);
                  }
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
  },

  subscribeOrderConfirmSSE(
    orderId: string,
    onConfirm: (data: OrderConfirmEvent) => void,
    onError: (err: any) => void
  ): () => void {
    let active = true;
    let xhr: XMLHttpRequest | null = null;

    (async () => {
      try {
        const token = await storage.getAccessToken();
        if (!active) return;
        
        const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
        const url = `${baseURL}/orders/${orderId}/stream/order-confirm`;
        
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
                  if (currentEvent === 'ORDER_UPDATED' || currentEvent === 'message') {
                    onConfirm(parsedData as OrderConfirmEvent);
                  }
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

