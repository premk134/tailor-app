import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
} from '../../database/entities/payment.entity';
import { Order, PaymentStatus as OrderPaymentStatus } from '../../database/entities/order.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2024-11-20.acacia',
      });
    } else {
      console.warn('⚠️  Stripe Secret Key not configured. Payment processing will be in demo mode.');
    }
  }

  async createPaymentIntent(orderId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.stripe) {
      // Demo mode
      const demoPayment = this.paymentRepository.create({
        orderId,
        provider: PaymentProvider.STRIPE,
        method: PaymentMethod.CARD,
        amount: order.total,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        transactionId: `demo_${Date.now()}`,
      });

      await this.paymentRepository.save(demoPayment);

      return {
        clientSecret: 'demo_secret_' + demoPayment.id,
        paymentIntentId: demoPayment.id,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: order.id,
          customerId: order.customerId,
        },
        description: `Order #${order.id}`,
      });

      const payment = this.paymentRepository.create({
        orderId,
        provider: PaymentProvider.STRIPE,
        method: PaymentMethod.CARD,
        amount: order.total,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        transactionId: paymentIntent.id,
        metadata: {
          paymentIntentId: paymentIntent.id,
        },
      });

      await this.paymentRepository.save(payment);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<any> {
    if (!this.stripe) {
      return { received: true, message: 'Demo mode - webhook skipped' };
    }

    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.warn('Stripe webhook secret not configured');
      return { received: true, message: 'Webhook secret not configured' };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      console.log('Received Stripe webhook:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id);
      return;
    }

    payment.status = PaymentStatus.SUCCEEDED;
    payment.paidAt = new Date();
    await this.paymentRepository.save(payment);

    // Update order payment status
    await this.orderRepository.update(
      { id: payment.orderId },
      { paymentStatus: OrderPaymentStatus.PAID },
    );

    console.log(`Payment succeeded for order ${payment.orderId}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentRepository.save(payment);

    // Update order payment status
    await this.orderRepository.update(
      { id: payment.orderId },
      { paymentStatus: OrderPaymentStatus.FAILED },
    );

    console.log(`Payment failed for order ${payment.orderId}`);
  }

  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: charge.payment_intent as string },
    });

    if (!payment) {
      console.error('Payment not found for charge:', charge.id);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      refundAmount: charge.amount_refunded / 100,
      refundId: charge.refunds.data[0]?.id,
    };

    await this.paymentRepository.save(payment);

    // Update order payment status
    await this.orderRepository.update(
      { id: payment.orderId },
      { paymentStatus: OrderPaymentStatus.REFUNDED },
    );

    console.log(`Refund processed for order ${payment.orderId}`);
  }

  async refundPayment(
    orderId: string,
    amount?: number,
    reason?: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId, status: PaymentStatus.SUCCEEDED },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new NotFoundException('No successful payment found for this order');
    }

    if (!this.stripe) {
      // Demo mode
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      await this.paymentRepository.save(payment);

      await this.orderRepository.update(
        { id: orderId },
        { paymentStatus: OrderPaymentStatus.REFUNDED },
      );

      return payment;
    }

    try {
      const refundAmount = amount
        ? Math.round(amount * 100)
        : Math.round(payment.amount * 100);

      const refund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: refundAmount,
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
      });

      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        refundId: refund.id,
        refundAmount: refundAmount / 100,
        refundReason: reason,
      };

      await this.paymentRepository.save(payment);

      // Update order payment status
      await this.orderRepository.update(
        { id: orderId },
        { paymentStatus: OrderPaymentStatus.REFUNDED },
      );

      return payment;
    } catch (error) {
      console.error('Refund error:', error);
      throw new BadRequestException('Failed to process refund');
    }
  }

  async findByOrder(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentStatus(paymentIntentId: string): Promise<{
    status: string;
    amount: number;
  }> {
    if (!this.stripe) {
      const payment = await this.paymentRepository.findOne({
        where: { transactionId: paymentIntentId },
      });

      return {
        status: payment?.status || 'unknown',
        amount: payment?.amount || 0,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
      );

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
      };
    } catch (error) {
      console.error('Error retrieving payment status:', error);
      throw new NotFoundException('Payment intent not found');
    }
  }
}
