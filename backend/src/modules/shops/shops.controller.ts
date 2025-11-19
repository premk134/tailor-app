import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.TAILOR)
  @ApiOperation({ summary: 'Create a new shop' })
  async create(@CurrentUser() user: any, @Body() createDto: CreateShopDto) {
    return this.shopsService.create(user.id, createDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all approved shops' })
  async findAll(@Query() filters: any) {
    return this.shopsService.findAll(filters);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get shop details' })
  async findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Get('owner/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my shops' })
  async findMyShops(@CurrentUser() user: any) {
    return this.shopsService.findByOwner(user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shop' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateShopDto>,
  ) {
    return this.shopsService.update(id, user.id, updateDto);
  }

  @Put(':id/toggle-accepting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle accepting orders' })
  async toggleAcceptingOrders(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shopsService.toggleAcceptingOrders(id, user.id);
  }
}
