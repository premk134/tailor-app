import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SMSOptions {
  to: string;
  message: string;
}

@Injectable()
export class SMSService {
  constructor(private configService: ConfigService) {}

  async sendSMS(options: SMSOptions): Promise<void> {
    try {
      // TODO: Integrate with Twilio, AWS SNS, or other SMS provider
      // For now, log to console
      console.log('📱 SMS (Development Mode):', {
        to: options.to,
        message: options.message,
      });

      /*
      Example Twilio integration:

      const twilio = require('twilio');
      const client = twilio(
        this.configService.get('TWILIO_ACCOUNT_SID'),
        this.configService.get('TWILIO_AUTH_TOKEN')
      );

      await client.messages.create({
        body: options.message,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to: options.to,
      });
      */
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async sendOTP(phoneNumber: string, code: string): Promise<void> {
    await this.sendSMS({
      to: phoneNumber,
      message: `Your Tailor App verification code is: ${code}. Valid for 5 minutes.`,
    });
  }

  async sendOrderUpdate(
    phoneNumber: string,
    orderNumber: string,
    status: string,
  ): Promise<void> {
    await this.sendSMS({
      to: phoneNumber,
      message: `Order #${orderNumber} status: ${status}. Visit app for details.`,
    });
  }
}
