import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeSubmissionDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Score must be a number' })
  @Min(0, { message: 'Score cannot be negative' })
  score!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
