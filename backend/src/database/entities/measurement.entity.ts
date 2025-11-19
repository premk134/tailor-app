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
import { Order } from './order.entity';
import { AuditLog } from './audit-log.entity';

export enum MeasurementTemplate {
  MENS_SHIRT = 'mens_shirt',
  MENS_PANTS = 'mens_pants',
  MENS_KURTA = 'mens_kurta',
  MENS_SUIT = 'mens_suit',
  WOMENS_BLOUSE = 'womens_blouse',
  WOMENS_KURTI = 'womens_kurti',
  WOMENS_SAREE_BLOUSE = 'womens_saree_blouse',
  WOMENS_SALWAR = 'womens_salwar',
  WOMENS_DRESS = 'womens_dress',
  CUSTOM = 'custom',
}

export enum MeasurementUnit {
  CM = 'cm',
  INCH = 'inch',
}

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.measurements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string; // e.g., "My Formal Shirt Size"

  @Column({
    type: 'enum',
    enum: MeasurementTemplate,
  })
  templateType: MeasurementTemplate;

  @Column({
    type: 'enum',
    enum: MeasurementUnit,
    default: MeasurementUnit.CM,
  })
  unit: MeasurementUnit;

  // Encrypted JSON containing actual measurements
  @Column({ type: 'text' })
  encryptedData: string;

  // Example structure of decrypted data:
  // {
  //   chest: 38,
  //   waist: 32,
  //   hips: 36,
  //   shoulder: 16,
  //   sleeveLength: 24,
  //   shirtLength: 28,
  //   neck: 15,
  //   ... more fields based on template
  // }

  @Column({ type: 'text', array: true, default: [] })
  photos: string[]; // S3 URLs

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  consentGiven: boolean; // Consent to share with tailors

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.measurement)
  orders: Order[];

  @OneToMany(() => AuditLog, (log) => log.targetId)
  accessLogs: AuditLog[];
}
