import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssignmentsService } from './assignments.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      assignment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      submission: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
    };

    service = new AssignmentsService(mockPrisma as any);
  });

  describe('create', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'c-404',
          { title: 'Project 1', description: 'Build an API' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor does not own the course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        instructorId: 'other-instructor',
      });

      await expect(
        service.create(
          'c-1',
          { title: 'Project 1', description: 'Build an API' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create assignment when caller is course instructor', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        instructorId: 'inst-1',
      });
      mockPrisma.assignment.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'a-1', ...data }),
      );

      const res = await service.create(
        'c-1',
        { title: 'Project 1', description: 'Build an API', maxScore: 100 },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(res.id).toBe('a-1');
      expect(res.title).toBe('Project 1');
      expect(res.maxScore).toBe(100);
    });
  });

  describe('findByCourse', () => {
    it('should throw ForbiddenException if student is not enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.findByCourse('c-1', 'stud-1', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return assignments if student is enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1' });
      mockPrisma.assignment.findMany.mockResolvedValue([
        { id: 'a-1', title: 'HW 1', submissions: [] },
      ]);

      const res = await service.findByCourse('c-1', 'stud-1', UserRole.STUDENT);
      expect(res).toHaveLength(1);
      expect(res[0].title).toBe('HW 1');
    });
  });

  describe('submit', () => {
    it('should throw NotFoundException if assignment does not exist', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValue(null);

      await expect(
        service.submit('a-999', { content: 'https://github.com/solution' }, 'stud-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student is not enrolled in parent course', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValue({
        id: 'a-1',
        courseId: 'c-1',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.submit('a-1', { content: 'https://github.com/solution' }, 'stud-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create new submission for enrolled student', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValue({
        id: 'a-1',
        courseId: 'c-1',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1' });
      mockPrisma.submission.findUnique.mockResolvedValue(null);
      mockPrisma.submission.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'sub-1', ...data }),
      );

      const res = await service.submit(
        'a-1',
        { content: 'https://github.com/student/repo' },
        'stud-1',
      );

      expect(res.id).toBe('sub-1');
      expect(res.status).toBe('SUBMITTED');
      expect(res.content).toBe('https://github.com/student/repo');
    });

    it('should throw BadRequestException if trying to resubmit already GRADED assignment', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValue({
        id: 'a-1',
        courseId: 'c-1',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1' });
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        status: 'GRADED',
      });

      await expect(
        service.submit('a-1', { content: 'Updated code' }, 'stud-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('gradeSubmission', () => {
    it('should throw ForbiddenException if instructor does not own the parent course', async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignment: {
          maxScore: 100,
          course: { instructorId: 'other-inst' },
        },
      });

      await expect(
        service.gradeSubmission(
          'sub-1',
          { score: 95, feedback: 'Great job!' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if score exceeds maxScore', async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignment: {
          maxScore: 100,
          course: { instructorId: 'inst-1' },
        },
      });

      await expect(
        service.gradeSubmission(
          'sub-1',
          { score: 105, feedback: 'Over max' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully grade submission', async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignment: {
          maxScore: 100,
          course: { instructorId: 'inst-1' },
        },
      });
      mockPrisma.submission.update.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'sub-1',
          score: data.score,
          feedback: data.feedback,
          status: data.status,
          gradedAt: data.gradedAt,
        }),
      );

      const res = await service.gradeSubmission(
        'sub-1',
        { score: 92, feedback: 'Excellent work!' },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(res.score).toBe(92);
      expect(res.feedback).toBe('Excellent work!');
      expect(res.status).toBe('GRADED');
      expect(res.gradedAt).toBeDefined();
    });
  });
});
