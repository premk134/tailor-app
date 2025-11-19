import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../database/entities/shop.entity';
import { Order } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getPendingShops() {
    return this.shopRepository.find({
      where: { status: ShopStatus.PENDING_APPROVAL },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveShop(shopId: string) {
    await this.shopRepository.update(shopId, { status: ShopStatus.APPROVED });
    return { message: 'Shop approved successfully' };
  }

  async rejectShop(shopId: string) {
    await this.shopRepository.update(shopId, { status: ShopStatus.REJECTED });
    return { message: 'Shop rejected successfully' };
  }

  async getStats() {
    const [totalUsers, totalShops, totalOrders] = await Promise.all([
      this.userRepository.count(),
      this.shopRepository.count({ where: { status: ShopStatus.APPROVED } }),
      this.orderRepository.count(),
    ]);

    return { totalUsers, totalShops, totalOrders };
  }

  async getAllOrders(filters?: any) {
    return this.orderRepository.find({
      relations: ['customer', 'shop'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
