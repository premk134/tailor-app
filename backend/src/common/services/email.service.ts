import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor(private configService: ConfigService) {
    this.templatesDir = path.join(process.cwd(), 'email-templates');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    // If no SMTP credentials, use test account (development)
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn(
        '⚠️  SMTP credentials not configured. Emails will be logged to console only.',
      );
      this.transporter = null as any;
    } else {
      this.transporter = nodemailer.createTransporter(emailConfig);
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;

      // Load template if specified
      if (options.template && options.context) {
        html = await this.renderTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: this.configService.get('SMTP_FROM') || 'noreply@tailorapp.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html,
      };

      if (!this.transporter) {
        console.log('📧 Email (Development Mode):', mailOptions);
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    try {
      const templatePath = path.join(
        this.templatesDir,
        `${templateName}.hbs`,
      );

      // If template doesn't exist, return a basic HTML
      if (!fs.existsSync(templatePath)) {
        return this.getDefaultTemplate(context);
      }

      const templateSource = await fs.promises.readFile(
        templatePath,
        'utf-8',
      );
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      console.error('Error rendering template:', error);
      return this.getDefaultTemplate(context);
    }
  }

  private getDefaultTemplate(context: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tailor App</h1>
            </div>
            <div class="content">
              <h2>${context.title || 'Notification'}</h2>
              <p>${context.message || ''}</p>
              ${context.actionUrl ? `<a href="${context.actionUrl}" class="button">View Details</a>` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Tailor App. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Specific email methods
  async sendOrderConfirmation(
    to: string,
    orderData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Order Confirmation - Tailor App',
      template: 'order-confirmation',
      context: {
        title: 'Order Confirmed',
        message: `Your order #${orderData.orderNumber} has been confirmed.`,
        orderData,
        actionUrl: `${this.configService.get('FRONTEND_URL')}/orders/${orderData.id}`,
      },
    });
  }

  async sendOrderStatusUpdate(
    to: string,
    orderData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Order Status Updated - ${orderData.status}`,
      template: 'order-status-update',
      context: {
        title: 'Order Status Updated',
        message: `Your order #${orderData.orderNumber} is now ${orderData.status}`,
        orderData,
        actionUrl: `${this.configService.get('FRONTEND_URL')}/orders/${orderData.id}`,
      },
    });
  }

  async sendShopApproval(
    to: string,
    shopData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Shop Approved - Tailor App',
      template: 'shop-approval',
      context: {
        title: 'Congratulations! Your Shop is Approved',
        message: `Your shop "${shopData.name}" has been approved and is now live.`,
        shopData,
        actionUrl: `${this.configService.get('FRONTEND_URL')}/tailor/shop`,
      },
    });
  }

  async sendWelcomeEmail(
    to: string,
    userName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Tailor App',
      template: 'welcome',
      context: {
        title: `Welcome ${userName}!`,
        message: 'Thank you for joining Tailor App. Start exploring custom tailoring services today.',
        userName,
        actionUrl: this.configService.get('FRONTEND_URL'),
      },
    });
  }

  async sendPasswordReset(
    to: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;
    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        title: 'Reset Your Password',
        message: 'Click the button below to reset your password. This link will expire in 1 hour.',
        actionUrl: resetUrl,
      },
    });
  }
}
