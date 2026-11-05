import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { Request, Response } from 'express';
import { RecordingsService } from './recordings.service.js';
import { CreateRecordingDto } from './dto/create-recording.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

const uploadDirectory = join(process.cwd(), 'uploads', 'recordings');
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

export const recordingStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.webm';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `rec-${uniqueSuffix}${ext}`);
  },
});

@Controller()
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post('rooms/:roomId/recordings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: recordingStorage,
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.includes('video') && !file.originalname.match(/\.(webm|mp4|mkv|mov)$/i)) {
          return cb(new BadRequestException('Only video files (webm, mp4, mkv, mov) are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Param('roomId') roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateRecordingDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    return this.recordingsService.create(roomId, file, dto, user.id, user.role);
  }

  @Get('courses/:courseId/recordings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.recordingsService.findByCourse(courseId, user.id, user.role);
  }

  @Delete('recordings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.recordingsService.delete(id, user.id, user.role);
  }

  // Public/direct media streaming endpoints for HTML5 <video> playback
  @Get('recordings/:id/stream')
  async streamRecording(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.recordingsService.streamRecording(id, req, res);
  }

  @Get('recordings/file/:fileName')
  async streamFile(
    @Param('fileName') fileName: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.recordingsService.streamFile(fileName, req, res);
  }
}
