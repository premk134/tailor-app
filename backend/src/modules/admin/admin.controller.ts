import { Controller, Get, Put, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('shops/pending')
  @ApiOperation({ summary: 'Get pending shop approvals' })
  async getPendingShops() {
    return this.adminService.getPendingShops();
  }

  @Put('shops/:id/approve')
  @ApiOperation({ summary: 'Approve shop' })
  async approveShop(@Param('id') id: string) {
    return this.adminService.approveShop(id);
  }

  @Put('shops/:id/reject')
  @ApiOperation({ summary: 'Reject shop' })
  async rejectShop(@Param('id') id: string) {
    return this.adminService.rejectShop(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  async getAllOrders(@Query() filters: any) {
    return this.adminService.getAllOrders(filters);
  }
}
