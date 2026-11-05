import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateDiscussionPostDto } from './dto/create-discussion-post.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    courseId: string,
    dto: CreateDiscussionPostDto,
    authorId: string,
    userRole: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (userRole === UserRole.STUDENT) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: authorId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You must be enrolled in this course to participate in discussions');
      }
    } else if (userRole === UserRole.INSTRUCTOR && course.instructorId !== authorId) {
      throw new ForbiddenException('You are not authorized to post in this course’s discussion');
    }

    let parentPost: any = null;
    if (dto.parentId) {
      parentPost = await this.prisma.discussionPost.findUnique({
        where: { id: dto.parentId },
      });
      if (!parentPost || parentPost.courseId !== courseId) {
        throw new BadRequestException('Invalid parent post ID for this course');
      }
    }

    const post = await this.prisma.discussionPost.create({
      data: {
        courseId,
        authorId,
        content: dto.content.trim(),
        parentId: dto.parentId || null,
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

    // Send notifications
    try {
      if (parentPost && parentPost.authorId !== authorId) {
        // Notify original author of reply
        await this.notificationsService.createNotification(
          parentPost.authorId,
          `New reply from ${post.author.firstName}`,
          `[${course.code}] ${dto.content.substring(0, 100)}`,
          'DISCUSSION_REPLY',
          `/student?course=${courseId}&tab=discussions`,
        );
      } else if (!dto.parentId && userRole === UserRole.STUDENT && course.instructorId !== authorId) {
        // Notify instructor of new question from student
        await this.notificationsService.createNotification(
          course.instructorId,
          `New Question in ${course.code}`,
          `${post.author.firstName} asked: "${dto.content.substring(0, 90)}"`,
          'DISCUSSION_QUESTION',
          `/instructor?course=${courseId}&tab=discussions`,
        );
      }
    } catch (err) {
      console.warn('[DiscussionsService] Notification delivery skipped:', err);
    }

    return post;
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
        throw new ForbiddenException('You must be enrolled in this course to view discussions');
      }
    } else if (userRole === UserRole.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You are not authorized to view discussions for this course');
    }

    return this.prisma.discussionPost.findMany({
      where: {
        courseId,
        parentId: null, // Root posts
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
        replies: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
