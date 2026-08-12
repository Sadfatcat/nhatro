import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InvoicesService } from './invoices.service';

@Injectable()
export class InvoicesListener {
  private readonly logger = new Logger(InvoicesListener.name);

  constructor(private readonly invoices: InvoicesService) {}

  @OnEvent('utility.recorded')
  async onUtilityRecorded(payload: { roomId: string; billingMonth: string }): Promise<void> {
    try {
      await this.invoices.syncInvoiceForPeriod(payload.roomId, payload.billingMonth);
      this.logger.log(`Đã đồng bộ hoá đơn cho phòng ${payload.roomId}, kỳ ${payload.billingMonth}.`);
    } catch (err) {
      this.logger.warn(`Không đồng bộ được hoá đơn cho phòng ${payload.roomId}, kỳ ${payload.billingMonth}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
