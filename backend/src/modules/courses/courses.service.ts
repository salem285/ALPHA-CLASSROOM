import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto, currentUserId: string, currentUserRole: string) {
    const cleanCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.course.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      throw new ConflictException(`Course with code "${cleanCode}" already exists.`);
    }

    let assignedInstructorId = currentUserId;
    if (currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN) {
      if (dto.instructorId) {
        assignedInstructorId = dto.instructorId;
      }
    }

    return this.prisma.course.create({
      data: {
        title: dto.title.trim(),
        code: cleanCode,
        description: dto.description?.trim(),
        instructorId: assignedInstructorId,
        isPublished: dto.isPublished ?? true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(isPublished = true) {
    return this.prisma.course.findMany({
      where: isPublished ? { isPublished: true } : {},
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found.`);
    }

    return course;
  }

  async enroll(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    if (!course.isPublished) {
      throw new BadRequestException('This course is not open for enrollment.');
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this course.');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId,
        studentId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    return {
      message: `Successfully enrolled in ${enrollment.course.title}`,
      enrollment,
    };
  }

  async findTeaching(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findEnrolled(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }
}
