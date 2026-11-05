import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordingsService } from './recordings.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('RecordingsService', () => {
  let service: RecordingsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      liveRoom: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
      recording: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new RecordingsService(mockPrisma as any);
  });

  describe('create', () => {
    const mockFile: any = {
      filename: 'rec-test.webm',
      path: 'uploads/recordings/rec-test.webm',
      size: 1048576,
    };

    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        service.create('room-1', null as any, {}, 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if live room does not exist', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue(null);

      await expect(
        service.create('room-999', mockFile, {}, 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor is not course owner', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        courseId: 'course-1',
        title: 'Session 1',
        course: { id: 'course-1', instructorId: 'other-instructor' },
      });

      await expect(
        service.create('room-1', mockFile, {}, 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully create recording record with serialized sizeBytes', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        courseId: 'course-1',
        title: 'Session 1',
        course: { id: 'course-1', instructorId: 'inst-1' },
      });

      mockPrisma.recording.create.mockResolvedValue({
        id: 'rec-1',
        roomId: 'room-1',
        courseId: 'course-1',
        title: 'Lecture Recording',
        fileName: 'rec-test.webm',
        fileUrl: '/uploads/recordings/rec-test.webm',
        durationSeconds: 120,
        sizeBytes: BigInt(1048576),
        recordedAt: new Date(),
      });

      const result = await service.create(
        'room-1',
        mockFile,
        { title: 'Lecture Recording', durationSeconds: 120 },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('rec-1');
      expect(result.sizeBytes).toBe(1048576);
      expect(typeof result.sizeBytes).toBe('number');
      expect(mockPrisma.recording.create).toHaveBeenCalled();
    });
  });

  describe('findByCourse', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findByCourse('c-999', 'student-1', UserRole.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student is not enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.findByCourse('c-1', 'student-1', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return recordings for enrolled student', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'e-1', courseId: 'c-1', studentId: 'student-1' });
      mockPrisma.recording.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          courseId: 'c-1',
          title: 'Lecture 1',
          fileName: 'rec-1.webm',
          fileUrl: '/uploads/recordings/rec-1.webm',
          durationSeconds: 1800,
          sizeBytes: BigInt(50000000),
          recordedAt: new Date(),
        },
      ]);

      const result = await service.findByCourse('c-1', 'student-1', UserRole.STUDENT);
      expect(result).toHaveLength(1);
      expect(result[0].sizeBytes).toBe(50000000);
    });

    it('should allow instructor of the course to retrieve recordings', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.recording.findMany.mockResolvedValue([]);

      const result = await service.findByCourse('c-1', 'inst-1', UserRole.INSTRUCTOR);
      expect(result).toEqual([]);
    });

    it('should allow admin to retrieve recordings', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.recording.findMany.mockResolvedValue([]);

      const result = await service.findByCourse('c-1', 'admin-1', UserRole.ADMIN);
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if recording not found', async () => {
      mockPrisma.recording.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('rec-999', 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor does not own the course', async () => {
      mockPrisma.recording.findUnique.mockResolvedValue({
        id: 'rec-1',
        fileName: 'rec-1.webm',
        course: { id: 'c-1', instructorId: 'other-inst' },
      });

      await expect(
        service.delete('rec-1', 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete recording when authorized', async () => {
      mockPrisma.recording.findUnique.mockResolvedValue({
        id: 'rec-1',
        fileName: 'rec-1.webm',
        course: { id: 'c-1', instructorId: 'inst-1' },
      });
      mockPrisma.recording.delete.mockResolvedValue({ id: 'rec-1' });

      const result = await service.delete('rec-1', 'inst-1', UserRole.INSTRUCTOR);
      expect(result.id).toBe('rec-1');
      expect(mockPrisma.recording.delete).toHaveBeenCalledWith({ where: { id: 'rec-1' } });
    });
  });
});
