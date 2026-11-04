import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty({ message: 'Exam title is required' })
  @MinLength(3, { message: 'Exam title must be at least 3 characters long' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt({ message: 'Duration must be an integer (in minutes)' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  durationMinutes!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Passing score must be a number' })
  @Min(0, { message: 'Passing score cannot be negative' })
  passingScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Total score must be a number' })
  @Min(1, { message: 'Total score must be at least 1' })
  totalScore?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}
