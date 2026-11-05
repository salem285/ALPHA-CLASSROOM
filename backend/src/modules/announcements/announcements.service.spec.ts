import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnnouncementsService } from './announcements.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let mockPrisma: any;
  let mockNotificationsService: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      announcement: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    mockNotificationsService = {
      createBatchNotifications: vi.fn().mockResolvedValue({ count: 1 }),
    };

    service = new AnnouncementsService(mockPrisma as any, mockNotificationsService as any);
  });

  describe('create', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'c-99',
          { title: 'Welcome', content: 'First class info' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor is not course owner', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        instructorId: 'other-instructor',
      });

      await expect(
        service.create(
          'c-1',
          { title: 'Welcome', content: 'First class info' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create announcement and trigger batch notifications for enrolled students', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        code: 'CS101',
        instructorId: 'inst-1',
      });

      mockPrisma.announcement.create.mockResolvedValue({
        id: 'a-1',
        courseId: 'c-1',
        title: 'Midterm Prep',
        content: 'Review chapter 4 and 5',
        isPinned: true,
        author: { firstName: 'Alice', lastName: 'Prof', email: 'alice@alpha.com' },
      });

      mockPrisma.enrollment.findMany.mockResolvedValue([
        { studentId: 'stud-1' },
        { studentId: 'stud-2' },
      ]);

      const result = await service.create(
        'c-1',
        { title: 'Midterm Prep', content: 'Review chapter 4 and 5', isPinned: true },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(result.id).toBe('a-1');
      expect(mockPrisma.announcement.create).toHaveBeenCalled();
      expect(mockNotificationsService.createBatchNotifications).toHaveBeenCalledWith(
        ['stud-1', 'stud-2'],
        'Announcement: Midterm Prep',
        '[CS101] Review chapter 4 and 5',
        'ANNOUNCEMENT',
        '/student?course=c-1',
      );
    });
  });

  describe('findByCourse', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.findByCourse('c-99', 'stud-1', UserRole.STUDENT)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.findByCourse('c-1', 'stud-1', UserRole.STUDENT)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return announcements ordered by isPinned and date', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1' });
      mockPrisma.announcement.findMany.mockResolvedValue([
        { id: 'a-1', title: 'Important Notice', isPinned: true },
      ]);

      const result = await service.findByCourse('c-1', 'stud-1', UserRole.STUDENT);
      expect(result).toHaveLength(1);
      expect(result[0].isPinned).toBe(true);
    });
  });
});
