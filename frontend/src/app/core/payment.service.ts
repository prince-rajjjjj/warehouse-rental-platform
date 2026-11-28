import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OrderInfo, RazorpaySuccess, User, VerifyPaymentRequest } from './models';

// Tells TypeScript that "Razorpay" exists (it is added by checkout.js).
declare const Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  createOrder(bookingId: number) {
    return this.http.post<OrderInfo>(`${this.baseUrl}/create-order`, { bookingId });
  }

  verify(body: VerifyPaymentRequest) {
    return this.http.post<{ status: string }>(`${this.baseUrl}/verify`, body);
  }

  openCheckout(
    order: OrderInfo,
    user: User,
    onSuccess: (r: RazorpaySuccess) => void,
    onClose: () => void,
  ): void {
    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amountInPaise,
      currency: order.currency,
      name: 'Warehouse Rental',
      description: order.description,
      order_id: order.orderId,
      prefill: { name: user.name, email: user.email, contact: user.phone ?? '' },
      handler: (r: RazorpaySuccess) => onSuccess(r),
      modal: { ondismiss: onClose },
    });
    checkout.open();
  }
}
