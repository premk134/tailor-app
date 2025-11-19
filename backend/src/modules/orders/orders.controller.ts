import { Controller, Get, Post, Put, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@CurrentUser() user: any, @Body() createDto: any) {
    return this.ordersService.create(user.id, createDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get my orders' })
  async findMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findByCustomer(user.id);
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get shop orders' })
  async findShopOrders(@Param('shopId') shopId: string) {
    return this.ordersService.findByShop(shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: any },
  ) {
    return this.ordersService.updateStatus(id, body.status, user.id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Add order review' })
  async addReview(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { rating: number; review: string },
  ) {
    return this.ordersService.addReview(id, user.id, body.rating, body.review);
  }
}
