import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoursesService } from './courses.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('CoursesService', () => {
  let coursesService: CoursesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };

    coursesService = new CoursesService(mockPrisma as any);
  });

  describe('create', () => {
    it('should throw ConflictException if course code exists', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: '1', code: 'CS101' });

      await expect(
        coursesService.create(
          { title: 'Intro to CS', code: 'CS101' },
          'instructor-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create course and uppercase code', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      mockPrisma.course.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'course-1',
          title: data.title,
          code: data.code,
          instructorId: data.instructorId,
          isPublished: data.isPublished,
        }),
      );

      const result = await coursesService.create(
        { title: 'Data Structures', code: 'cs102' },
        'instructor-1',
        UserRole.INSTRUCTOR,
      );

      expect(result.code).toBe('CS102');
      expect(result.instructorId).toBe('instructor-1');
    });
  });

  describe('enroll', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(coursesService.enroll('c-999', 'student-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if course is not published', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', isPublished: false });

      await expect(coursesService.enroll('c-1', 'student-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if student is already enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', isPublished: true });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1' });

      await expect(coursesService.enroll('c-1', 'student-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should enroll student and return active status', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', isPublished: true });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.create.mockResolvedValue({
        id: 'e-2',
        courseId: 'c-1',
        studentId: 'student-1',
        status: 'ACTIVE',
        course: { id: 'c-1', title: 'Data Structures', code: 'CS102' },
      });

      const res = await coursesService.enroll('c-1', 'student-1');
      expect(res.enrollment.status).toBe('ACTIVE');
      expect(res.message).toContain('Data Structures');
    });
  });
});
