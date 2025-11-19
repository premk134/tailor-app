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
import { Product } from './product.entity';
import { Order } from './order.entity';

export enum ShopStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum ServiceCategory {
  MENS_WEAR = 'mens_wear',
  WOMENS_WEAR = 'womens_wear',
  KIDS_WEAR = 'kids_wear',
  ALTERATIONS = 'alterations',
  CUSTOM_DESIGN = 'custom_design',
  BRIDAL_WEAR = 'bridal_wear',
}

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.shops)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ShopStatus,
    default: ShopStatus.PENDING_APPROVAL,
  })
  status: ShopStatus;

  @Column({ type: 'enum', enum: ServiceCategory, array: true, default: [] })
  categories: ServiceCategory[];

  @Column({ type: 'text', array: true, default: [] })
  images: string[]; // Shop photos

  @Column({ type: 'jsonb', nullable: true })
  workingHours: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };

  @Column({ type: 'int', default: 10 })
  maxConcurrentOrders: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ default: true })
  acceptingOrders: boolean;

  @Column({ type: 'jsonb', nullable: true })
  paymentMethods: {
    cash?: boolean;
    card?: boolean;
    upi?: boolean;
    online?: boolean;
  };

  @Column({ type: 'text', nullable: true })
  bankDetails: string; // Encrypted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Product, (product) => product.shop)
  products: Product[];

  @OneToMany(() => Order, (order) => order.shop)
  orders: Order[];
}
