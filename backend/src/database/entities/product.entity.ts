import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shop } from './shop.entity';
import { MeasurementTemplate } from './measurement.entity';

export enum ProductType {
  STANDARD = 'standard',
  CUSTOM = 'custom',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shopId: string;

  @ManyToOne(() => Shop, (shop) => shop.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.STANDARD,
  })
  type: ProductType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  // Customization options
  @Column({ type: 'jsonb', nullable: true })
  options: {
    fabrics?: Array<{
      name: string;
      priceAdjustment: number;
      available: boolean;
    }>;
    colors?: Array<{
      name: string;
      hexCode?: string;
      priceAdjustment: number;
      available: boolean;
    }>;
    stitchingTypes?: Array<{
      name: string;
      description?: string;
      priceAdjustment: number;
      available: boolean;
    }>;
    addons?: Array<{
      name: string;
      description?: string;
      price: number;
      available: boolean;
    }>;
  };

  // Measurement requirements
  @Column({
    type: 'enum',
    enum: MeasurementTemplate,
    nullable: true,
  })
  measurementTemplate: MeasurementTemplate;

  @Column({ type: 'text', array: true, default: [] })
  requiredMeasurements: string[]; // e.g., ['chest', 'waist', 'length']

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @Column({ type: 'int', default: 5 })
  estimatedDays: number; // Estimated completion time

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
