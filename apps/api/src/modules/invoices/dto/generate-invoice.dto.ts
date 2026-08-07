import { IsArray, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class GenerateInvoiceDto {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'period phải theo định dạng YYYY-MM' })
  period: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsOptional()
  roomIds?: string[];
}
