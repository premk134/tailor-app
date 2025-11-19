import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../database/entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
  ) {}

  async create(ownerId: string, createDto: CreateShopDto) {
    const shop = this.shopRepository.create({
      ownerId,
      ...createDto,
      status: ShopStatus.PENDING_APPROVAL,
    });

    return this.shopRepository.save(shop);
  }

  async findAll(filters?: { city?: string; category?: string; acceptingOrders?: boolean }) {
    const query = this.shopRepository
      .createQueryBuilder('shop')
      .where('shop.status = :status', { status: ShopStatus.APPROVED });

    if (filters?.city) {
      query.andWhere('LOWER(shop.city) = LOWER(:city)', { city: filters.city });
    }

    if (filters?.category) {
      query.andWhere(':category = ANY(shop.categories)', { category: filters.category });
    }

    if (filters?.acceptingOrders !== undefined) {
      query.andWhere('shop.acceptingOrders = :acceptingOrders', {
        acceptingOrders: filters.acceptingOrders,
      });
    }

    query.orderBy('shop.rating', 'DESC');

    return query.getMany();
  }

  async findOne(id: string) {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['owner', 'products'],
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async findByOwner(ownerId: string) {
    return this.shopRepository.find({ where: { ownerId } });
  }

  async update(id: string, ownerId: string, updateDto: Partial<CreateShopDto>) {
    const shop = await this.shopRepository.findOne({ where: { id } });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this shop');
    }

    Object.assign(shop, updateDto);
    return this.shopRepository.save(shop);
  }

  async updateStatus(id: string, status: ShopStatus) {
    const shop = await this.shopRepository.findOne({ where: { id } });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    shop.status = status;
    return this.shopRepository.save(shop);
  }

  async toggleAcceptingOrders(id: string, ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { id } });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this shop');
    }

    shop.acceptingOrders = !shop.acceptingOrders;
    return this.shopRepository.save(shop);
  }

  async checkCapacity(shopId: string): Promise<boolean> {
    const shop = await this.shopRepository.findOne({ where: { id: shopId } });

    if (!shop || !shop.acceptingOrders) {
      return false;
    }

    // Count active orders (not completed/cancelled)
    const activeOrdersCount = await this.shopRepository
      .createQueryBuilder('shop')
      .leftJoin('shop.orders', 'order')
      .where('shop.id = :shopId', { shopId })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: ['completed', 'cancelled', 'delivered'],
      })
      .getCount();

    return activeOrdersCount < shop.maxConcurrentOrders;
  }
}
