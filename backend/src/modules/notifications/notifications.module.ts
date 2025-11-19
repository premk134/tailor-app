import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../database/entities/notification.entity';
import { EmailService } from '../../common/services/email.service';
import { SMSService } from '../../common/services/sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, SMSService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
