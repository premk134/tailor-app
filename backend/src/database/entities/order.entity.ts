import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Shop } from './shop.entity';
import { Measurement } from './measurement.entity';
import { Payment } from './payment.entity';
import { OrderEvent } from './order-event.entity';
import { Message } from './message.entity';

export enum OrderStatus {
  CREATED = 'created',
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  IN_PRODUCTION = 'in_production',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum DeliveryType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  shopId: string;

  @ManyToOne(() => Shop, (shop) => shop.orders)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column({ nullable: true })
  measurementId: string;

  @ManyToOne(() => Measurement, (measurement) => measurement.orders)
  @JoinColumn({ name: 'measurementId' })
  measurement: Measurement;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  // Order items with selected options
  @Column({ type: 'jsonb' })
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    basePrice: number;
    selectedOptions?: {
      fabric?: string;
      color?: string;
      stitchingType?: string;
      addons?: string[];
    };
    priceAdjustments: number;
    totalPrice: number;
    notes?: string;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  // Delivery information
  @Column({
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.PICKUP,
  })
  deliveryType: DeliveryType;

  @Column({ type: 'jsonb', nullable: true })
  deliveryAddress: {
    fullName?: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  customerNotes: string;

  @Column({ type: 'text', nullable: true })
  tailorNotes: string;

  @Column({ type: 'text', array: true, default: [] })
  attachments: string[]; // Customer uploads (reference images, etc.)

  // Rating and review
  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToMany(() => OrderEvent, (event) => event.order)
  events: OrderEvent[];

  @OneToMany(() => Message, (message) => message.order)
  messages: Message[];
}
