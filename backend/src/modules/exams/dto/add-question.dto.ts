import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Question text is required' })
  text!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1, { message: 'Points must be at least 0.1' })
  points?: number;

  @IsArray({ message: 'Options must be an array' })
  @IsNotEmpty({ message: 'Question options are required' })
  options!: Array<{ id: string; text: string }>;

  @IsString()
  @IsNotEmpty({ message: 'Correct answer is required' })
  correctAnswer!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderIndex?: number;
}
