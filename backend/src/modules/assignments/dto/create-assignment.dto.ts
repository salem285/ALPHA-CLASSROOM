import { IsNotEmpty, IsOptional, IsString, MinLength, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Assignment title is required' })
  @MinLength(3, { message: 'Assignment title must be at least 3 characters long' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Assignment description is required' })
  description!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Max score must be an integer' })
  @Min(1, { message: 'Max score must be at least 1' })
  maxScore?: number;
}
