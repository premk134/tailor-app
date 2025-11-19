import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_REJECTED = 'order_rejected',
  ORDER_STATUS_UPDATED = 'order_status_updated',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  NEW_MESSAGE = 'new_message',
  SHOP_APPROVED = 'shop_approved',
  SHOP_REJECTED = 'shop_rejected',
  REVIEW_RECEIVED = 'review_received',
  MEASUREMENT_SHARED = 'measurement_shared',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

@Entity('notifications')
@Index(['userId', 'read'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
  })
  channels: NotificationChannel[];

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}
