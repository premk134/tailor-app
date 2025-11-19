import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent for order' })
  @ApiBody({ schema: { properties: { orderId: { type: 'string' } } } })
  async createPaymentIntent(@Body() body: { orderId: string }) {
    return this.paymentsService.createPaymentIntent(body.orderId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler (public endpoint)' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = request.rawBody || Buffer.from('');
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @Post('refund/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund payment for order' })
  @ApiBody({
    schema: {
      properties: {
        amount: { type: 'number', description: 'Amount to refund (optional, defaults to full amount)' },
        reason: { type: 'string', description: 'Reason for refund' },
      },
    },
  })
  async refundPayment(
    @Param('orderId') orderId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.paymentsService.refundPayment(
      orderId,
      body.amount,
      body.reason,
    );
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments for an order' })
  async findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Get('status/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status by payment intent ID' })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentsService.getPaymentStatus(paymentIntentId);
  }
}
