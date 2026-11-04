import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExamsService } from './exams.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ExamsService', () => {
  let service: ExamsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      exam: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      question: {
        create: vi.fn(),
      },
      examAttempt: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
    };

    service = new ExamsService(mockPrisma as any);
  });

  describe('create', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'c-999',
          { title: 'Midterm Exam', durationMinutes: 30 },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor does not own course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'other-inst' });

      await expect(
        service.create(
          'c-1',
          { title: 'Midterm Exam', durationMinutes: 30 },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create exam when caller is owner', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.exam.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'ex-1', ...data }),
      );

      const res = await service.create(
        'c-1',
        { title: 'Midterm Exam', durationMinutes: 45, passingScore: 60, totalScore: 100 },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(res.id).toBe('ex-1');
      expect(res.title).toBe('Midterm Exam');
      expect(res.durationMinutes).toBe(45);
      expect(res.passingScore).toBe(60);
    });
  });

  describe('addQuestion', () => {
    it('should throw NotFoundException if exam does not exist', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);

      await expect(
        service.addQuestion(
          'ex-999',
          {
            text: 'What is 2+2?',
            options: [
              { id: 'a', text: '3' },
              { id: 'b', text: '4' },
            ],
            correctAnswer: 'b',
          },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add question with options and correct answer', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'ex-1',
        course: { instructorId: 'inst-1' },
      });
      mockPrisma.question.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'q-1', ...data }),
      );

      const res = await service.addQuestion(
        'ex-1',
        {
          text: 'What is 2+2?',
          points: 5,
          options: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
          ],
          correctAnswer: 'b',
        },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(res.id).toBe('q-1');
      expect(res.correctAnswer).toBe('b');
      expect(res.points).toBe(5);
    });
  });

  describe('takeExam', () => {
    it('should throw BadRequestException if exam is not published', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'ex-1',
        isPublished: false,
        questions: [],
      });

      await expect(service.takeExam('ex-1', 'stud-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if student not enrolled in parent course', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'ex-1',
        courseId: 'c-1',
        isPublished: true,
        questions: [],
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.takeExam('ex-1', 'stud-1')).rejects.toThrow(ForbiddenException);
    });

    it('should strip correctAnswer from all questions when student takes exam', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'ex-1',
        courseId: 'c-1',
        title: 'Quiz 1',
        durationMinutes: 30,
        passingScore: 50,
        totalScore: 100,
        isPublished: true,
        questions: [
          {
            id: 'q-1',
            text: 'Question 1',
            type: 'MULTIPLE_CHOICE',
            points: 1,
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
            ],
            correctAnswer: 'SECRET_ANSWER_A',
            orderIndex: 0,
          },
        ],
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'en-1' });
      mockPrisma.examAttempt.findUnique.mockResolvedValue(null);
      mockPrisma.examAttempt.create.mockResolvedValue({
        id: 'att-1',
        examId: 'ex-1',
        studentId: 'stud-1',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });

      const res = await service.takeExam('ex-1', 'stud-1');
      expect(res.exam.questions).toHaveLength(1);
      const returnedQuestion = res.exam.questions[0] as any;
      expect(returnedQuestion.id).toBe('q-1');
      expect(returnedQuestion.text).toBe('Question 1');
      expect(returnedQuestion.correctAnswer).toBeUndefined(); // MUST BE STRIPPED
    });
  });

  describe('submitExam & auto-grading', () => {
    it('should calculate 100% score and mark as passed when all answers are correct', async () => {
      mockPrisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'IN_PROGRESS',
        exam: {
          totalScore: 100,
          passingScore: 50,
          questions: [
            { id: 'q-1', points: 1, correctAnswer: 'a' },
            { id: 'q-2', points: 1, correctAnswer: 'b' },
          ],
        },
      });
      mockPrisma.examAttempt.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'att-1', ...data }),
      );

      const res = await service.submitExam(
        'ex-1',
        {
          answers: {
            'q-1': 'a',
            'q-2': 'b',
          },
        },
        'stud-1',
      );

      expect(res.score).toBe(100);
      expect(res.isPassed).toBe(true);
      expect(res.earnedPoints).toBe(2);
      expect(res.totalPossiblePoints).toBe(2);
    });

    it('should calculate partial score and determine failed status when below passingScore', async () => {
      mockPrisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'IN_PROGRESS',
        exam: {
          totalScore: 100,
          passingScore: 60,
          questions: [
            { id: 'q-1', points: 1, correctAnswer: 'a' },
            { id: 'q-2', points: 1, correctAnswer: 'b' },
          ],
        },
      });
      mockPrisma.examAttempt.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'att-1', ...data }),
      );

      const res = await service.submitExam(
        'ex-1',
        {
          answers: {
            'q-1': 'a',
            'q-2': 'wrong_answer',
          },
        },
        'stud-1',
      );

      expect(res.score).toBe(50);
      expect(res.isPassed).toBe(false); // 50 < 60
    });

    it('should throw BadRequestException if attempt is already completed', async () => {
      mockPrisma.examAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'AUTO_GRADED',
        exam: { questions: [] },
      });

      await expect(
        service.submitExam('ex-1', { answers: {} }, 'stud-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
