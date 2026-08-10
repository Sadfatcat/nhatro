import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SendBulkNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  invoiceIds!: string[];
}
