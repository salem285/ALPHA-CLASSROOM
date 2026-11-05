import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
