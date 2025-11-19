import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../database/entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { SearchShopsDto, SortBy } from './dto/search-shops.dto';

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

  async search(searchDto: SearchShopsDto): Promise<{
    shops: Shop[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      query: searchQuery,
      city,
      state,
      category,
      minRating,
      acceptingOrders,
      fastDelivery,
      latitude,
      longitude,
      maxDistance,
      sortBy,
      page = 1,
      limit = 20,
    } = searchDto;

    const queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .where('shop.status = :status', { status: ShopStatus.APPROVED });

    // Full-text search
    if (searchQuery) {
      queryBuilder.andWhere(
        '(LOWER(shop.name) LIKE LOWER(:query) OR LOWER(shop.description) LIKE LOWER(:query) OR LOWER(shop.address) LIKE LOWER(:query))',
        { query: `%${searchQuery}%` },
      );
    }

    // Location filters
    if (city) {
      queryBuilder.andWhere('LOWER(shop.city) = LOWER(:city)', { city });
    }

    if (state) {
      queryBuilder.andWhere('LOWER(shop.state) = LOWER(:state)', { state });
    }

    // Category filter
    if (category) {
      queryBuilder.andWhere(':category = ANY(shop.categories)', { category });
    }

    // Rating filter
    if (minRating !== undefined) {
      queryBuilder.andWhere('shop.rating >= :minRating', { minRating });
    }

    // Accepting orders filter
    if (acceptingOrders !== undefined) {
      queryBuilder.andWhere('shop.acceptingOrders = :acceptingOrders', {
        acceptingOrders,
      });
    }

    // Fast delivery filter (shops with avg completion < 7 days)
    if (fastDelivery) {
      queryBuilder.andWhere('shop.avgCompletionDays <= 7');
    }

    // Distance-based search
    if (latitude && longitude && maxDistance) {
      // Calculate distance using Haversine formula
      queryBuilder.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(shop.latitude)) * cos(radians(shop.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(shop.latitude)))) <= :maxDistance`,
        { lat: latitude, lng: longitude, maxDistance },
      );
    }

    // Sorting
    if (latitude && longitude && sortBy === SortBy.DISTANCE) {
      queryBuilder.addSelect(
        `(6371 * acos(cos(radians(${latitude})) * cos(radians(shop.latitude)) * cos(radians(shop.longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(shop.latitude))))`,
        'distance',
      );
      queryBuilder.orderBy('distance', 'ASC');
    } else {
      switch (sortBy) {
        case SortBy.RATING:
          queryBuilder.orderBy('shop.rating', 'DESC');
          break;
        case SortBy.NEWEST:
          queryBuilder.orderBy('shop.createdAt', 'DESC');
          break;
        case SortBy.POPULAR:
          queryBuilder.orderBy('shop.totalOrders', 'DESC');
          break;
        default:
          queryBuilder.orderBy('shop.rating', 'DESC');
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [shops, total] = await queryBuilder.getManyAndCount();

    return {
      shops,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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
