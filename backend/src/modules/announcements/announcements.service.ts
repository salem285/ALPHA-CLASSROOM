import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    courseId: string,
    dto: CreateAnnouncementDto,
    authorId: string,
    userRole: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && course.instructorId !== authorId) {
      throw new ForbiddenException('You are not authorized to post announcements for this course');
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        courseId,
        authorId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        isPinned: dto.isPinned ?? false,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Notify all enrolled students in background
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId },
        select: { studentId: true },
      });

      const studentIds = enrollments.map((e) => e.studentId);
      if (studentIds.length > 0) {
        const previewMsg =
          dto.content.length > 120
            ? dto.content.substring(0, 117) + '...'
            : dto.content;

        await this.notificationsService.createBatchNotifications(
          studentIds,
          `Announcement: ${dto.title}`,
          `[${course.code}] ${previewMsg}`,
          'ANNOUNCEMENT',
          `/student?course=${courseId}`,
        );
      }
    } catch (err) {
      console.warn('[AnnouncementsService] Failed to deliver student notifications:', err);
    }

    return announcement;
  }

  async findByCourse(courseId: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

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
        throw new ForbiddenException('You must be enrolled in this course to view announcements');
      }
    } else if (userRole === UserRole.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You are not authorized to view announcements for this course');
    }

    return this.prisma.announcement.findMany({
      where: { courseId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}
