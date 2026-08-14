import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @IsOptional()
  @IsIn(['sms'])
  channel?: 'sms';
}
