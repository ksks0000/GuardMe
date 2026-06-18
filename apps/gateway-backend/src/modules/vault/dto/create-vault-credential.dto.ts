import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVaultCredentialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  serviceName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password!: string;
}
