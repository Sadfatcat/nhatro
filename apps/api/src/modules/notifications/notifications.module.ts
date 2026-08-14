import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';
import { NotificationsCron } from './notifications.cron';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

@Module({
  imports:     [InvoicesModule],
  controllers: [NotificationsController],
  providers:   [NotificationsService, NotificationsListener, NotificationsCron, EmailProvider, SmsProvider],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
