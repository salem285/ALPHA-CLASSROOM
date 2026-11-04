import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { AddQuestionDto } from './dto/add-question.dto.js';
import { SubmitExamDto } from './dto/submit-exam.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: string, dto: CreateExamDto, userId: string, userRole: string) {
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
      throw new ForbiddenException('You can only create exams for courses you teach.');
    }

    return this.prisma.exam.create({
      data: {
        courseId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        durationMinutes: dto.durationMinutes,
        passingScore: dto.passingScore ?? 50.0,
        totalScore: dto.totalScore ?? 100.0,
        isPublished: dto.isPublished ?? false,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
      },
    });
  }

  async addQuestion(examId: string, dto: AddQuestionDto, userId: string, userRole: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      exam.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only add questions to exams for courses you teach.');
    }

    return this.prisma.question.create({
      data: {
        examId,
        text: dto.text.trim(),
        type: dto.type ?? 'MULTIPLE_CHOICE',
        points: dto.points ?? 1.0,
        options: dto.options as any,
        correctAnswer: dto.correctAnswer.trim(),
        orderIndex: dto.orderIndex ?? 0,
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
        where: { courseId_studentId: { courseId, studentId: userId } },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course.');
      }

      return this.prisma.exam.findMany({
        where: {
          courseId,
          isPublished: true,
        },
        include: {
          attempts: {
            where: { studentId: userId },
            select: {
              id: true,
              score: true,
              isPassed: true,
              status: true,
              startedAt: true,
              submittedAt: true,
            },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (
      userRole === UserRole.INSTRUCTOR &&
      course.instructorId !== userId
    ) {
      throw new ForbiddenException('You do not have permission to view exams for this course.');
    }

    return this.prisma.exam.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async takeExam(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!exam.isPublished) {
      throw new BadRequestException('This exam is not open for attempts.');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId: exam.courseId, studentId } },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in the course for this exam.');
    }

    let attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });

    if (attempt) {
      if (attempt.status === 'AUTO_GRADED' || attempt.status === 'SUBMITTED') {
        throw new BadRequestException('You have already completed this exam.');
      }
    } else {
      attempt = await this.prisma.examAttempt.create({
        data: {
          examId,
          studentId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor(
        exam.durationMinutes * 60 -
          (Date.now() - new Date(attempt.startedAt).getTime()) / 1000,
      ),
    );

    // CRITICAL SECURITY: Strip 'correctAnswer' from all returned questions
    const sanitizedQuestions = exam.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      points: q.points,
      options: q.options,
      orderIndex: q.orderIndex,
    }));

    return {
      exam: {
        id: exam.id,
        courseId: exam.courseId,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        passingScore: exam.passingScore,
        totalScore: exam.totalScore,
        questions: sanitizedQuestions,
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        answers: attempt.answers,
      },
      remainingSeconds,
    };
  }

  async submitExam(examId: string, dto: SubmitExamDto, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found. Please start the exam first.');
    }

    if (attempt.status === 'AUTO_GRADED' || attempt.status === 'SUBMITTED') {
      throw new BadRequestException('You have already submitted this exam.');
    }

    const questions = attempt.exam.questions;
    let earnedPoints = 0;
    let totalPossiblePoints = 0;

    for (const q of questions) {
      totalPossiblePoints += q.points;
      const selectedAnswer = dto.answers[q.id];
      const isCorrect =
        selectedAnswer !== undefined &&
        selectedAnswer.toString().trim().toLowerCase() ===
          q.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        earnedPoints += q.points;
      }
    }

    const finalScore =
      totalPossiblePoints > 0
        ? Number(
            (
              (earnedPoints / totalPossiblePoints) *
              attempt.exam.totalScore
            ).toFixed(2),
          )
        : 0;

    const isPassed = finalScore >= attempt.exam.passingScore;

    const updatedAttempt = await this.prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: dto.answers as any,
        score: finalScore,
        isPassed,
        submittedAt: new Date(),
        status: 'AUTO_GRADED',
      },
    });

    return {
      message: isPassed
        ? `Congratulations! You passed with a score of ${finalScore}/${attempt.exam.totalScore}.`
        : `Exam completed. Your score is ${finalScore}/${attempt.exam.totalScore}. (Passing: ${attempt.exam.passingScore})`,
      score: finalScore,
      isPassed,
      totalScore: attempt.exam.totalScore,
      passingScore: attempt.exam.passingScore,
      earnedPoints,
      totalPossiblePoints,
      attempt: updatedAttempt,
    };
  }

  async findExamResults(examId: string, userId: string, userRole: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      exam.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only view results for your own course exams.');
    }

    return this.prisma.examAttempt.findMany({
      where: { examId },
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

  async getMyResult(examId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            totalScore: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('You have not attempted this exam.');
    }

    return attempt;
  }
}
