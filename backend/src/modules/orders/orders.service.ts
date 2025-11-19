import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../database/entities/order.entity';
import { OrderEvent, OrderEventType } from '../../database/entities/order-event.entity';
import { ShopsService } from '../shops/shops.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderEvent)
    private orderEventRepository: Repository<OrderEvent>,
    private shopsService: ShopsService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  async create(customerId: string, createDto: any) {
    // Check shop capacity
    const hasCapacity = await this.shopsService.checkCapacity(createDto.shopId);
    if (!hasCapacity) {
      throw new BadRequestException('Shop is not accepting orders at this time');
    }

    const order = this.orderRepository.create({
      customerId,
      ...createDto,
      status: OrderStatus.CREATED,
      paymentStatus: PaymentStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create event
    await this.createEvent(savedOrder.id, OrderEventType.CREATED, customerId);

    return savedOrder;
  }

  async findByCustomer(customerId: string) {
    return this.orderRepository.find({
      where: { customerId },
      relations: ['shop', 'measurement'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByShop(shopId: string) {
    return this.orderRepository.find({
      where: { shopId },
      relations: ['customer', 'measurement'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['shop', 'customer', 'measurement', 'events', 'events.actor'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus, actorId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;

    if (status === OrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
    } else if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    await this.orderRepository.save(order);

    // Create event
    await this.createEvent(orderId, OrderEventType.STATUS_UPDATED, actorId, {
      newStatus: status,
    });

    return order;
  }

  async addReview(orderId: string, customerId: string, rating: number, review: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, customerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed orders');
    }

    order.rating = rating;
    order.review = review;
    order.reviewedAt = new Date();

    await this.orderRepository.save(order);

    // Create event
    await this.createEvent(orderId, OrderEventType.REVIEWED, customerId, {
      rating,
    });

    return order;
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    reason: string,
    cancelledBy: 'customer' | 'tailor',
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'shop'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate cancellation permissions
    if (cancelledBy === 'customer' && order.customerId !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }

    if (cancelledBy === 'tailor' && order.shop.ownerId !== userId) {
      throw new BadRequestException('You can only cancel orders for your shop');
    }

    // Check if order can be cancelled
    const canCancel = this.canCancelOrder(order, cancelledBy);
    if (!canCancel.allowed) {
      throw new BadRequestException(canCancel.reason);
    }

    // Update order status
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await this.orderRepository.save(order);

    // Create cancellation event
    await this.createEvent(orderId, OrderEventType.CANCELLED, userId, {
      reason,
      cancelledBy,
    });

    // Process refund if payment was made
    if (order.paymentStatus === PaymentStatus.PAID) {
      try {
        await this.paymentsService.refundPayment(
          orderId,
          undefined, // Full refund
          `Order cancelled by ${cancelledBy}: ${reason}`,
        );

        await this.createEvent(orderId, OrderEventType.REFUND_PROCESSED, userId, {
          amount: order.total,
        });
      } catch (error) {
        console.error('Failed to process refund:', error);
        // Log event but don't fail the cancellation
        await this.createEvent(orderId, OrderEventType.REFUND_FAILED, userId, {
          error: error.message,
        });
      }
    }

    return order;
  }

  async rejectOrder(orderId: string, tailorId: string, reason: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['shop'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.shop.ownerId !== tailorId) {
      throw new BadRequestException('You can only reject orders for your shop');
    }

    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('Can only reject pending orders');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await this.orderRepository.save(order);

    await this.createEvent(orderId, OrderEventType.REJECTED, tailorId, {
      reason,
    });

    // Refund if payment was made
    if (order.paymentStatus === PaymentStatus.PAID) {
      try {
        await this.paymentsService.refundPayment(
          orderId,
          undefined,
          `Order rejected by tailor: ${reason}`,
        );

        await this.createEvent(orderId, OrderEventType.REFUND_PROCESSED, tailorId, {
          amount: order.total,
        });
      } catch (error) {
        console.error('Failed to process refund:', error);
      }
    }

    return order;
  }

  private canCancelOrder(
    order: Order,
    cancelledBy: 'customer' | 'tailor',
  ): { allowed: boolean; reason?: string } {
    // Cannot cancel completed orders
    if (order.status === OrderStatus.COMPLETED) {
      return { allowed: false, reason: 'Cannot cancel completed orders' };
    }

    // Cannot cancel already cancelled orders
    if (order.status === OrderStatus.CANCELLED) {
      return { allowed: false, reason: 'Order is already cancelled' };
    }

    // Customer cancellation rules
    if (cancelledBy === 'customer') {
      // Can cancel before confirmation or within X hours of confirmation
      if (
        order.status === OrderStatus.CREATED ||
        order.status === OrderStatus.PENDING_CONFIRMATION
      ) {
        return { allowed: true };
      }

      // Check if within cancellation window (24 hours)
      if (order.confirmedAt) {
        const hoursSinceConfirmation =
          (Date.now() - order.confirmedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceConfirmation < 24) {
          return { allowed: true };
        }

        return {
          allowed: false,
          reason: 'Order can only be cancelled within 24 hours of confirmation',
        };
      }

      // Cannot cancel in-production or ready orders
      if (
        order.status === OrderStatus.IN_PRODUCTION ||
        order.status === OrderStatus.READY
      ) {
        return {
          allowed: false,
          reason: 'Cannot cancel orders that are in production or ready',
        };
      }
    }

    // Tailor can cancel/reject at any time before completion
    if (cancelledBy === 'tailor') {
      return { allowed: true };
    }

    return { allowed: true };
  }

  async getCancellationPolicy(orderId: string): Promise<{
    canCancel: boolean;
    reason?: string;
    refundAmount?: number;
    refundPercentage?: number;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const canCancelResult = this.canCancelOrder(order, 'customer');

    if (!canCancelResult.allowed) {
      return {
        canCancel: false,
        reason: canCancelResult.reason,
      };
    }

    // Calculate refund based on order status
    let refundPercentage = 100;

    if (order.status === OrderStatus.CONFIRMED && order.confirmedAt) {
      const hoursSinceConfirmation =
        (Date.now() - order.confirmedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceConfirmation < 12) {
        refundPercentage = 100;
      } else if (hoursSinceConfirmation < 24) {
        refundPercentage = 75;
      } else {
        refundPercentage = 0;
      }
    }

    return {
      canCancel: true,
      refundAmount: (order.total * refundPercentage) / 100,
      refundPercentage,
    };
  }

  private async createEvent(
    orderId: string,
    eventType: OrderEventType,
    actorId: string,
    payload?: any,
  ) {
    const event = this.orderEventRepository.create({
      orderId,
      eventType,
      actorId,
      payload,
    });
    await this.orderEventRepository.save(event);
  }
}
