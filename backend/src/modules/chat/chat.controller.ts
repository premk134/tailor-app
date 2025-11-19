import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@CurrentUser() user: any, @Body() body: any) {
    return this.chatService.create(user.id, body.toId, body.text, body.orderId);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get messages by order' })
  async getOrderMessages(@Param('orderId') orderId: string) {
    return this.chatService.findByOrder(orderId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(@Param('id') id: string) {
    return this.chatService.markAsRead(id);
  }
}
