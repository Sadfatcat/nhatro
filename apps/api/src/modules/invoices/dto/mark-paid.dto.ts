import { IsOptional, IsString } from 'class-validator';

export class MarkPaidDto {
  @IsString()
  @IsOptional()
  markedBy?: string;
}
