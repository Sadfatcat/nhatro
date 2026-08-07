import { IsArray, IsOptional, IsString } from 'class-validator';

export class BulkMarkPaidDto {
  @IsArray()
  ids: string[];

  @IsString()
  @IsOptional()
  markedBy?: string;
}
