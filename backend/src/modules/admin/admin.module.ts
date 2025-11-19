import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Shop } from '../../database/entities/shop.entity';
import { Order } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, Order, User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
