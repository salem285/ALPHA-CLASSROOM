import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty({ message: 'Course title is required' })
  @MinLength(3, { message: 'Course title must be at least 3 characters long' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Course code is required' })
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
