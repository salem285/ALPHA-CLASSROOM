import { IsNotEmpty, IsObject } from 'class-validator';

export class SubmitExamDto {
  @IsObject({ message: 'Answers must be an object with question IDs as keys' })
  @IsNotEmpty({ message: 'Answers payload is required' })
  answers!: Record<string, string>;
}
