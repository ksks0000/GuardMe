import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class UebaAnomaliesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 15;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
