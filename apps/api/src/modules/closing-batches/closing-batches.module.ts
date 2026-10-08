import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { ClosingBatchesController } from './closing-batches.controller';
import { ClosingBatchesService } from './closing-batches.service';

@Module({
  imports:     [InvoicesModule],
  controllers: [ClosingBatchesController],
  providers:   [ClosingBatchesService],
})
export class ClosingBatchesModule {}
