import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(shopId: string, createDto: any) {
    const product = this.productRepository.create({ shopId, ...createDto });
    return this.productRepository.save(product);
  }

  async findByShop(shopId: string) {
    return this.productRepository.find({
      where: { shopId, isActive: true },
      order: { orderCount: 'DESC' },
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['shop'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, shopId: string, updateDto: any) {
    const product = await this.productRepository.findOne({
      where: { id, shopId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    Object.assign(product, updateDto);
    return this.productRepository.save(product);
  }

  async delete(id: string, shopId: string) {
    const product = await this.productRepository.findOne({
      where: { id, shopId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.isActive = false;
    await this.productRepository.save(product);
    return { message: 'Product deleted successfully' };
  }
}
