export interface OrderItem {
  concertId: string;
  ticketTypeId: string;
  quantity: number;
}

export interface BookingRequest {
  data: OrderItem[];
}

export interface BookingResponse {
  success: boolean;
  message: string;
  orderId: string;
  totalPrice: number;
  paymentDeadline: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';

export interface PaymentDetails {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  paymentRef: string;
  processedAt: string;
}

// Raw backend structures
export interface RawOrderItem {
  concert_id: string;
  ticket_type_id: string;
  quantity: number;
}

export interface RawBookingRequest {
  data: RawOrderItem[];
}

export interface RawBookingResponse {
  success: boolean;
  message: string;
  data: {
    order_id: string;
    total_price: number;
    payment_deadline: string;
  };
}

export interface RawPaymentDetails {
  success: boolean;
  data: {
    payment_id: string;
    order_id: string;
    status: PaymentStatus;
    amount: number;
    payment_ref: string;
    processed_at: string;
  };
}
