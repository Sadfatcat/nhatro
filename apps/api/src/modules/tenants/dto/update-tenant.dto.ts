import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string | null;

  @IsString()
  @IsOptional()
  hometown?: string | null;

  @IsString()
  @IsOptional()
  nationalId?: string | null;

  @IsString()
  @IsOptional()
  tenantIdDate?: string | null;

  @IsString()
  @IsOptional()
  nationalIdIssuePlace?: string | null;
}
