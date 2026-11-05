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
      assignment: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      submission: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      exam: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      examAttempt: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      liveRoom: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      attendanceRecord: {
        count: vi.fn(),
        findMany: vi.fn(),
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
      ).rejects.toThrow(/Invalid Access Code/i);
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

  describe('calculateStudentProgress', () => {
    it('should calculate weighted progress: 40% assignments, 40% exams, 20% attendance', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', title: 'Calculus' });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1', status: 'ACTIVE' });

      // 1 of 2 assignments completed -> 50% * 40 = 20
      mockPrisma.assignment.count.mockResolvedValue(2);
      mockPrisma.submission.count.mockResolvedValue(1);

      // 1 of 1 exam completed -> 100% * 40 = 40
      mockPrisma.exam.count.mockResolvedValue(1);
      mockPrisma.examAttempt.count.mockResolvedValue(1);

      // 1 of 2 live sessions attended -> 50% * 20 = 10
      mockPrisma.liveRoom.count.mockResolvedValue(2);
      mockPrisma.attendanceRecord.count.mockResolvedValue(1);

      // Expected overall: 20 + 40 + 10 = 70%
      const progress = await coursesService.calculateStudentProgress('c-1', 'student-1');

      expect(progress.completedAssignments).toBe(1);
      expect(progress.totalAssignments).toBe(2);
      expect(progress.completedExams).toBe(1);
      expect(progress.totalExams).toBe(1);
      expect(progress.attendanceRate).toBe(50);
      expect(progress.overallPercentage).toBe(70);
    });
  });

  describe('exportGradesCsv', () => {
    it('should generate formatted CSV report of student grades', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        code: 'CS101',
        instructorId: 'inst-1',
        enrollments: [
          {
            student: { id: 's-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          },
        ],
        assignments: [
          { id: 'a-1', submissions: [{ studentId: 's-1', score: 90 }] },
        ],
        exams: [
          { id: 'ex-1', attempts: [{ studentId: 's-1', score: 80 }] },
        ],
      });

      const result = await coursesService.exportGradesCsv('c-1', 'inst-1', UserRole.INSTRUCTOR);

      expect(result.filename).toBe('course_CS101_grades.csv');
      expect(result.csv).toContain('Student Name,Email,Assignments Completed');
      expect(result.csv).toContain('"John Doe","john@example.com",1/1,90.0,1/1,80.0,85.0');
    });
  });

  describe('exportAttendanceCsv', () => {
    it('should generate formatted CSV report of session attendance', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        code: 'CS101',
        instructorId: 'inst-1',
        liveRooms: [
          {
            id: 'r-1',
            title: 'Week 1 Lecture',
            attendanceRecords: [
              {
                student: { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
                status: 'PRESENT',
                joinedAt: new Date('2026-11-01T10:00:00Z'),
                leftAt: new Date('2026-11-01T11:00:00Z'),
                durationMinutes: 60,
              },
            ],
          },
        ],
      });

      const result = await coursesService.exportAttendanceCsv('c-1', 'inst-1', UserRole.INSTRUCTOR);

      expect(result.filename).toBe('course_CS101_attendance.csv');
      expect(result.csv).toContain('Student Name,Email,Session Room,Session Date');
      expect(result.csv).toContain('"Alice Smith","alice@example.com","Week 1 Lecture",2026-11-01,PRESENT');
      expect(result.csv).toContain(',60');
    });
  });
});
