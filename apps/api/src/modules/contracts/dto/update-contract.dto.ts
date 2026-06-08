import { IsDateString, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateContractDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt() @Min(1) @Max(31)
  @IsOptional()
  firstBillingDate?: number;

  @IsInt() @Min(1) @Max(31)
  @IsOptional()
  lastBillingDate?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
