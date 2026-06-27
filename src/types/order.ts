export interface OrderItem {
  concertId: string;
  ticketTypeId: string;
  quantity: number;
}

export interface BookingRequest {
  paymentMethod: 'stripe';
  data: OrderItem[];
}

export interface BookingResponse {
  success: boolean;
  message: string;
  orderId: string;
  totalPrice: number;
  paymentDeadline: string;
  paymentUrl?: string;
}

export type PaymentStatus = 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface PaymentDetails {
  orderId: string;
  status: PaymentStatus;
  totalPrice: number;
  paymentDeadline: string;
  paymentUrl?: string;
}

// Raw structures representing backend responses
export interface RawBookingResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    totalPrice: number;
    paymentDeadline: string;
    paymentUrl?: string;
  };
}

