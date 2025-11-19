import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromId: string;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'fromId' })
  from: User;

  @Column()
  toId: string;

  @ManyToOne(() => User, (user) => user.receivedMessages)
  @JoinColumn({ name: 'toId' })
  to: User;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.messages, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'text', array: true, default: [] })
  attachments: string[];

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
