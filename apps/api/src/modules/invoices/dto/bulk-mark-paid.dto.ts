import { IsArray } from 'class-validator';

export class BulkMarkPaidDto {
  @IsArray()
  ids: string[];
}
