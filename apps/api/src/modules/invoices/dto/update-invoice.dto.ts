import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  rentAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  electricityAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  waterAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  garbageFee?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  otherFees?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  deduction?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
