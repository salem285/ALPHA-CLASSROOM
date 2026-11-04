import { IsNotEmpty, IsString } from 'class-validator';

export class EnrollCourseDto {
  @IsString()
  @IsNotEmpty({ message: 'Course access code is required' })
  accessCode!: string;
}
