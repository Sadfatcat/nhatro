import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateContractDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

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
