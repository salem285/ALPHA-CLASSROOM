import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: string, dto: CreateAssignmentDto, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only create assignments for courses you teach.');
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    return this.prisma.assignment.create({
      data: {
        courseId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        dueDate,
        maxScore: dto.maxScore ?? 100,
      },
    });
  }

  async findByCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
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
        throw new ForbiddenException('You are not enrolled in this course.');
      }
    } else if (
      userRole === UserRole.INSTRUCTOR &&
      course.instructorId !== userId
    ) {
      throw new ForbiddenException('You do not have permission to view assignments for this course.');
    }

    return this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions:
          userRole === UserRole.STUDENT
            ? {
                where: { studentId: userId },
                select: {
                  id: true,
                  content: true,
                  score: true,
                  feedback: true,
                  status: true,
                  submittedAt: true,
                  gradedAt: true,
                },
              }
            : {
                select: {
                  id: true,
                  status: true,
                  score: true,
                  studentId: true,
                },
              },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submit(assignmentId: string, dto: SubmitAssignmentDto, studentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: assignment.courseId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in the course for this assignment.');
    }

    const existing = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'GRADED') {
        throw new BadRequestException('Cannot resubmit an assignment that has already been graded.');
      }

      return this.prisma.submission.update({
        where: { id: existing.id },
        data: {
          content: dto.content.trim(),
          submittedAt: new Date(),
        },
      });
    }

    return this.prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        content: dto.content.trim(),
        status: 'SUBMITTED',
      },
    });
  }

  async findSubmissions(assignmentId: string, userId: string, userRole: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      assignment.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only view submissions for your own courses.');
    }

    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto, userId: string, userRole: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { course: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      submission.assignment.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only grade submissions for your own courses.');
    }

    if (dto.score > submission.assignment.maxScore) {
      throw new BadRequestException(`Score cannot exceed maximum score of ${submission.assignment.maxScore}.`);
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignment: true,
      },
    });
  }
}
