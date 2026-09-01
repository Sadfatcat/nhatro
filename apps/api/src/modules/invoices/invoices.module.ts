import { forwardRef, Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesListener } from './invoices.listener';
import { RoomsModule } from '../rooms/rooms.module';
import { ContractsModule } from '../contracts/contracts.module';
import { UtilitiesModule } from '../utilities/utilities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports:     [RoomsModule, ContractsModule, UtilitiesModule, forwardRef(() => NotificationsModule)],
  controllers: [InvoicesController],
  providers:   [InvoicesService, InvoicesListener],
  exports:     [InvoicesService],
})
export class InvoicesModule {}
