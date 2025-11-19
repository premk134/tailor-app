import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../../database/entities/notification.entity';
import { EmailService } from '../../common/services/email.service';
import { SMSService } from '../../common/services/sms.service';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  actionUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private smsService: SMSService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      status: NotificationStatus.PENDING,
    });

    await this.notificationRepository.save(notification);

    // Send notifications asynchronously
    this.sendNotification(notification).catch((error) => {
      console.error('Failed to send notification:', error);
      this.updateStatus(notification.id, NotificationStatus.FAILED, error.message);
    });

    return notification;
  }

  private async sendNotification(notification: Notification): Promise<void> {
    const user = notification.user;

    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            if (user?.email) {
              await this.emailService.sendEmail({
                to: user.email,
                subject: notification.title,
                template: this.getEmailTemplate(notification.type),
                context: {
                  title: notification.title,
                  message: notification.message,
                  actionUrl: notification.actionUrl,
                  ...notification.data,
                },
              });
            }
            break;

          case NotificationChannel.SMS:
            if (user?.phone) {
              await this.smsService.sendSMS({
                to: user.phone,
                message: notification.message,
              });
            }
            break;

          case NotificationChannel.PUSH:
            // TODO: Implement push notifications (FCM, APNS)
            console.log('Push notification:', notification.message);
            break;

          case NotificationChannel.IN_APP:
            // In-app notifications are stored in DB, no action needed
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    await this.updateStatus(notification.id, NotificationStatus.SENT);
  }

  private getEmailTemplate(type: NotificationType): string {
    const templateMap: Record<NotificationType, string> = {
      [NotificationType.ORDER_CREATED]: 'order-created',
      [NotificationType.ORDER_CONFIRMED]: 'order-confirmation',
      [NotificationType.ORDER_REJECTED]: 'order-rejected',
      [NotificationType.ORDER_STATUS_UPDATED]: 'order-status-update',
      [NotificationType.ORDER_COMPLETED]: 'order-completed',
      [NotificationType.ORDER_CANCELLED]: 'order-cancelled',
      [NotificationType.PAYMENT_RECEIVED]: 'payment-received',
      [NotificationType.PAYMENT_FAILED]: 'payment-failed',
      [NotificationType.REFUND_PROCESSED]: 'refund-processed',
      [NotificationType.NEW_MESSAGE]: 'new-message',
      [NotificationType.SHOP_APPROVED]: 'shop-approval',
      [NotificationType.SHOP_REJECTED]: 'shop-rejected',
      [NotificationType.REVIEW_RECEIVED]: 'review-received',
      [NotificationType.MEASUREMENT_SHARED]: 'measurement-shared',
    };

    return templateMap[type] || 'default';
  }

  async findByUser(
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id, userId },
      { read: true, readAt: new Date() },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }

  private async updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string,
  ): Promise<void> {
    const updates: any = { status };
    if (status === NotificationStatus.SENT) {
      updates.sentAt = new Date();
    }
    if (error) {
      updates.error = error;
    }
    await this.notificationRepository.update(id, updates);
  }

  // Helper methods for common notification scenarios
  async notifyOrderCreated(
    userId: string,
    orderData: any,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.ORDER_CREATED,
      title: 'New Order Received',
      message: `You have a new order #${orderData.orderNumber}`,
      channels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ],
      data: { orderId: orderData.id, orderNumber: orderData.orderNumber },
      actionUrl: `/orders/${orderData.id}`,
    });
  }

  async notifyOrderStatusUpdate(
    userId: string,
    orderData: any,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.ORDER_STATUS_UPDATED,
      title: 'Order Status Updated',
      message: `Your order #${orderData.orderNumber} is now ${orderData.status}`,
      channels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
      ],
      data: { orderId: orderData.id, status: orderData.status },
      actionUrl: `/orders/${orderData.id}`,
    });
  }

  async notifyPaymentReceived(
    userId: string,
    paymentData: any,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of $${paymentData.amount} received for order #${paymentData.orderNumber}`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      data: { paymentId: paymentData.id, amount: paymentData.amount },
      actionUrl: `/orders/${paymentData.orderId}`,
    });
  }

  async notifyShopApproved(userId: string, shopData: any): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.SHOP_APPROVED,
      title: 'Shop Approved',
      message: `Your shop "${shopData.name}" has been approved!`,
      channels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
      ],
      data: { shopId: shopData.id },
      actionUrl: '/tailor/shop',
    });
  }

  async notifyNewMessage(
    userId: string,
    messageData: any,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: `You have a new message from ${messageData.senderName}`,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      data: { messageId: messageData.id, orderId: messageData.orderId },
      actionUrl: `/orders/${messageData.orderId}/chat`,
    });
  }
}
