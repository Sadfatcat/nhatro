import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class MergeInvoicesDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  invoiceIds!: string[];
}
