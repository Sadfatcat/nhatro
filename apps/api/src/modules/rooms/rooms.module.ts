import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports:     [ContractsModule],
  controllers: [RoomsController],
  providers:   [RoomsService],
  exports:     [RoomsService],
})
export class RoomsModule {}
