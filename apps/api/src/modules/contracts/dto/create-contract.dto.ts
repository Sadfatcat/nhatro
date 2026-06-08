import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateContractDto {
  @IsString()
  roomId: string;

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
