import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../database/entities/order.entity';
import { OrderEvent, OrderEventType } from '../../database/entities/order-event.entity';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderEvent)
    private orderEventRepository: Repository<OrderEvent>,
    private shopsService: ShopsService,
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
