import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';
import { NotificationsCron } from './notifications.cron';
import { EmailProvider } from './providers/email.provider';
import { ZaloProvider } from './providers/zalo.provider';

@Module({
  imports:     [InvoicesModule],
  controllers: [NotificationsController],
  providers:   [NotificationsService, NotificationsListener, NotificationsCron, EmailProvider, ZaloProvider],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
