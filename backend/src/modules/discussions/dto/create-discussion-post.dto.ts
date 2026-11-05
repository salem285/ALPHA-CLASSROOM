import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDiscussionPostDto {
  @IsNotEmpty({ message: 'Post content cannot be empty' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
