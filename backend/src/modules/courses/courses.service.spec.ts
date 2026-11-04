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

    it('should create course, uppercase code, and generate access code if not provided', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      mockPrisma.course.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'course-1',
          title: data.title,
          code: data.code,
          accessCode: data.accessCode,
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
      expect(result.accessCode).toBeDefined();
      expect(result.accessCode).toMatch(/^ALPHA-[A-Z0-9]{4}$/);
    });

    it('should create course with custom access code uppercased', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      mockPrisma.course.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'course-2',
          title: data.title,
          code: data.code,
          accessCode: data.accessCode,
          instructorId: data.instructorId,
          isPublished: data.isPublished,
        }),
      );

      const result = await coursesService.create(
        { title: 'Algorithms', code: 'CS201', accessCode: 'algo-2026' },
        'instructor-1',
        UserRole.INSTRUCTOR,
      );

      expect(result.accessCode).toBe('ALGO-2026');
    });
  });

  describe('findAll', () => {
    it('should query courses with select excluding accessCode', async () => {
      mockPrisma.course.findMany.mockImplementation(({ select }: any) => {
        expect(select.accessCode).toBeUndefined();
        return Promise.resolve([
          {
            id: 'c-1',
            title: 'Intro to CS',
            code: 'CS101',
            description: 'Basics',
            isPublished: true,
          },
        ]);
      });

      const courses = await coursesService.findAll(true);
      expect(courses).toHaveLength(1);
      expect((courses[0] as any).accessCode).toBeUndefined();
    });
  });

  describe('enroll', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        coursesService.enroll('c-999', 'student-1', { accessCode: 'ALPHA-1234' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if course is not published', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        isPublished: false,
        accessCode: 'ALPHA-1234',
      });

      await expect(
        coursesService.enroll('c-1', 'student-1', { accessCode: 'ALPHA-1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if access code does not match', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        isPublished: true,
        accessCode: 'ALPHA-SECRET',
      });

      await expect(
        coursesService.enroll('c-1', 'student-1', { accessCode: 'WRONG-CODE' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        coursesService.enroll('c-1', 'student-1', { accessCode: 'WRONG-CODE' }),
      ).rejects.toThrow(/Invalid course access code/i);
    });

    it('should throw ConflictException if student is already enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        isPublished: true,
        accessCode: 'ALPHA-MATCH',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1' });

      await expect(
        coursesService.enroll('c-1', 'student-1', { accessCode: 'ALPHA-MATCH' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully enroll student when accessCode matches (case-insensitive)', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        isPublished: true,
        accessCode: 'ALPHA-2026',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.create.mockResolvedValue({
        id: 'e-2',
        courseId: 'c-1',
        studentId: 'student-1',
        status: 'ACTIVE',
        course: { id: 'c-1', title: 'Data Structures', code: 'CS102' },
      });

      const res = await coursesService.enroll('c-1', 'student-1', {
        accessCode: 'alpha-2026',
      });
      expect(res.enrollment.status).toBe('ACTIVE');
      expect(res.message).toContain('Data Structures');
    });
  });
});
