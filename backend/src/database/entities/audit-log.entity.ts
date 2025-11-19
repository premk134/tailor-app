import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  MEASUREMENT_CREATED = 'measurement_created',
  MEASUREMENT_VIEWED = 'measurement_viewed',
  MEASUREMENT_UPDATED = 'measurement_updated',
  MEASUREMENT_DELETED = 'measurement_deleted',
  MEASUREMENT_SHARED = 'measurement_shared',
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  DATA_EXPORT = 'data_export',
  CONSENT_GIVEN = 'consent_given',
  CONSENT_REVOKED = 'consent_revoked',
}

export enum TargetType {
  USER = 'user',
  MEASUREMENT = 'measurement',
  ORDER = 'order',
  SHOP = 'shop',
  PRODUCT = 'product',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  actorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: TargetType,
  })
  targetType: TargetType;

  @Column()
  targetId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
