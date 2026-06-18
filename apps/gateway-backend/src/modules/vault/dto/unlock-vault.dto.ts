import { IsString, MaxLength, MinLength } from 'class-validator';

export class UnlockVaultDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
