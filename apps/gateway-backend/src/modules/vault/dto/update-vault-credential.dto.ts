import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateVaultCredentialDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  serviceName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password?: string;
}
