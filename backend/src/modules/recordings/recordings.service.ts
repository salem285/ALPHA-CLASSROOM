import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRecordingDto } from './dto/create-recording.dto.js';
import { UserRole } from '@prisma/client';
import { join } from 'node:path';
import { existsSync, unlinkSync, statSync, createReadStream } from 'node:fs';
import type { Request, Response } from 'express';

@Injectable()
export class RecordingsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatRecording(recording: any) {
    if (!recording) return null;
    return {
      ...recording,
      sizeBytes: Number(recording.sizeBytes || 0),
    };
  }

  async create(
    roomId: string,
    file: Express.Multer.File,
    dto: CreateRecordingDto,
    userId: string,
    userRole: UserRole,
  ) {
    if (!file) {
      throw new BadRequestException('Recording video file is required');
    }

    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: { course: true },
    });

    if (!room) {
      // Clean up uploaded file if room does not exist
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      throw new NotFoundException(`Live room with ID ${roomId} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && room.course.instructorId !== userId) {
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      throw new ForbiddenException('You are not authorized to upload recordings for this course');
    }

    const title =
      dto.title?.trim() ||
      room.title ||
      `Lecture Recording - ${new Date().toLocaleDateString()}`;

    const durationSeconds = dto.durationSeconds ? Math.max(0, Math.round(Number(dto.durationSeconds))) : 0;
    const sizeBytes = BigInt(file.size || 0);
    const fileUrl = `/uploads/recordings/${file.filename}`;

    const recording = await this.prisma.recording.create({
      data: {
        roomId: room.id,
        courseId: room.courseId,
        title,
        fileName: file.filename,
        fileUrl,
        durationSeconds,
        sizeBytes,
      },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            roomName: true,
            createdAt: true,
            endedAt: true,
          },
        },
      },
    });

    return this.formatRecording(recording);
  }

  async findByCourse(courseId: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Role-based access validation
    if (userRole === UserRole.STUDENT) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You must be enrolled in this course to view session recordings');
      }
    } else if (userRole === UserRole.INSTRUCTOR) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You are not authorized to view recordings for this course');
      }
    }

    const recordings = await this.prisma.recording.findMany({
      where: { courseId },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            roomName: true,
            createdAt: true,
            endedAt: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    return recordings.map((r) => this.formatRecording(r));
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const recording = await this.prisma.recording.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!recording) {
      throw new NotFoundException(`Recording with ID ${id} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && recording.course.instructorId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this recording');
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'uploads', 'recordings', recording.fileName);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (err) {
        console.warn(`[RecordingsService] Failed to unlink file ${filePath}:`, err);
      }
    }

    await this.prisma.recording.delete({
      where: { id },
    });

    return { message: 'Recording deleted successfully', id };
  }

  async streamRecording(id: string, req: Request, res: Response) {
    const recording = await this.prisma.recording.findUnique({
      where: { id },
    });

    if (!recording) {
      throw new NotFoundException(`Recording with ID ${id} not found`);
    }

    this.pipeVideoFile(recording.fileName, req, res);
  }

  async streamFile(fileName: string, req: Request, res: Response) {
    this.pipeVideoFile(fileName, req, res);
  }

  private pipeVideoFile(fileName: string, req: Request, res: Response) {
    const sanitizedFileName = fileName.replace(/(\.\.[\/\\])+/g, '');
    const filePath = join(process.cwd(), 'uploads', 'recordings', sanitizedFileName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Video file not found on server disk');
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mimeType = sanitizedFileName.endsWith('.mp4') ? 'video/mp4' : 'video/webm';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
        return;
      }

      const chunksize = end - start + 1;
      const file = createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      };

      res.writeHead(200, head);
      createReadStream(filePath).pipe(res);
    }
  }
}
