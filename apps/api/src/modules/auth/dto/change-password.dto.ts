import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ required: false, description: 'Bắt buộc trừ khi người gọi là ADMIN' })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword!: string;

  @ApiProperty()
  @IsString()
  confirmPassword!: string;
}
