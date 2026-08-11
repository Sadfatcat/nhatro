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
      const result = await this.invoices.generate({ period: payload.billingMonth, roomIds: [payload.roomId] });
      if (result.created.length > 0) {
        this.logger.log(`Đã tự động sinh hoá đơn cho phòng ${payload.roomId}, kỳ ${payload.billingMonth}.`);
      }
    } catch (err) {
      this.logger.warn(`Không tự sinh được hoá đơn cho phòng ${payload.roomId}, kỳ ${payload.billingMonth}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
