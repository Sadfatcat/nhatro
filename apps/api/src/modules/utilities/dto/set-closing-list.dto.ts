import { ArrayNotEmpty, IsArray, IsBoolean, IsString } from 'class-validator';

export class SetClosingListDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roomIds!: string[];

  @IsBoolean()
  add!: boolean;
}
