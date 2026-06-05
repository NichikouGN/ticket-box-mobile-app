import { apiClient } from './api';
import { 
  BookingRequest, 
  BookingResponse, 
  OrderItem, 
  PaymentDetails, 
  RawBookingResponse, 
  RawPaymentDetails 
} from '@/types/order';

export const orderService = {
  async createOrder(items: OrderItem[], idempotencyKey: string): Promise<BookingResponse> {
    // Map items from camelCase to snake_case for backend compatibility
    const rawData = items.map(item => ({
      concert_id: item.concertId,
      ticket_type_id: item.ticketTypeId,
      quantity: item.quantity,
    }));

    const response = await apiClient.post<RawBookingResponse>('/orders', 
      { data: rawData },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        }
      }
    );

    const resData = response.data;
    
    return {
      success: resData.success,
      message: resData.message,
      orderId: resData.data.order_id,
      totalPrice: resData.data.total_price,
      paymentDeadline: resData.data.payment_deadline,
    };
  },

  async getPaymentStatus(orderOrPaymentId: string): Promise<PaymentDetails> {
    const response = await apiClient.get<RawPaymentDetails>(`/payments/${orderOrPaymentId}`);
    const rawData = response.data.data;

    return {
      paymentId: rawData.payment_id,
      orderId: rawData.order_id,
      status: rawData.status,
      amount: rawData.amount,
      paymentRef: rawData.payment_ref,
      processedAt: rawData.processed_at,
    };
  },

  async triggerMockPayment(orderId: string, scenario: 'success' | 'fail' | 'timeout'): Promise<any> {
    const response = await apiClient.post('/payments', {
      orderId,
      order_id: orderId,
      status: scenario === 'success' ? 'SUCCESS' : scenario === 'fail' ? 'FAILED' : 'PENDING',
      scenario: scenario,
    });
    return response.data;
  }
};
