import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Submission content or link is required' })
  content!: string;
}
