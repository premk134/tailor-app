import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Order } from '../../database/entities/order.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
  ) {}

  async createPaymentIntent(orderId: string) {
    // In production, integrate with Stripe
    // const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
    // const paymentIntent = await stripe.paymentIntents.create({...});

    return {
      clientSecret: 'demo_secret',
      message: 'Payment intent created (demo mode)',
    };
  }

  async handleWebhook(payload: any, signature: string) {
    // Verify webhook signature
    // Process payment events
    return { received: true };
  }

  async findByOrder(orderId: string) {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
