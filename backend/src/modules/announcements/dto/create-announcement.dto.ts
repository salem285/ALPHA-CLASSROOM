import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAnnouncementDto {
  @IsNotEmpty({ message: 'Announcement title is required' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Announcement content is required' })
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
