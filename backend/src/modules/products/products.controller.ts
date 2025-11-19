import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('shop/:shopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  async create(@Param('shopId') shopId: string, @Body() createDto: any) {
    return this.productsService.create(shopId, createDto);
  }

  @Public()
  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get products by shop' })
  async findByShop(@Param('shopId') shopId: string) {
    return this.productsService.findByShop(shopId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product details' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id/shop/:shopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  async update(@Param('id') id: string, @Param('shopId') shopId: string, @Body() updateDto: any) {
    return this.productsService.update(id, shopId, updateDto);
  }

  @Delete(':id/shop/:shopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  async delete(@Param('id') id: string, @Param('shopId') shopId: string) {
    return this.productsService.delete(id, shopId);
  }
}
