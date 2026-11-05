import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomsService } from './rooms.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('RoomsService', () => {
  let service: RoomsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      liveRoom: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
      attendanceRecord: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };

    service = new RoomsService(mockPrisma as any);
  });

  describe('create', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'c-999',
          { title: 'Live Lecture 1' },
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
          { title: 'Live Lecture 1' },
          'inst-1',
          UserRole.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should close existing live rooms and create a new room for course instructor', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Fullstack Web',
        code: 'CS101',
        instructorId: 'inst-1',
      });
      mockPrisma.liveRoom.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.liveRoom.create.mockResolvedValue({
        id: 'room-1',
        courseId: 'c-1',
        title: 'Live Lecture 1',
        roomName: 'room-cs101-1234567890',
        isLive: true,
      });

      const result = await service.create(
        'c-1',
        { title: 'Live Lecture 1' },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(mockPrisma.liveRoom.updateMany).toHaveBeenCalledWith({
        where: { courseId: 'c-1', isLive: true },
        data: expect.objectContaining({ isLive: false }),
      });
      expect(mockPrisma.liveRoom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            courseId: 'c-1',
            title: 'Live Lecture 1',
            isLive: true,
          }),
        }),
      );
      expect(result.id).toBe('room-1');
    });

    it('should allow ADMIN to create room even if not instructor', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Fullstack Web',
        code: 'CS101',
        instructorId: 'inst-1',
      });
      mockPrisma.liveRoom.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.liveRoom.create.mockResolvedValue({
        id: 'room-admin',
        courseId: 'c-1',
        title: 'Admin Session',
        roomName: 'room-cs101-9999999999',
        isLive: true,
      });

      const result = await service.create(
        'c-1',
        { title: 'Admin Session' },
        'admin-1',
        UserRole.ADMIN,
      );

      expect(result.id).toBe('room-admin');
    });
  });

  describe('findActiveByCourse', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findActiveByCourse('c-999', 'student-1', UserRole.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student is not enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.findActiveByCourse('c-1', 'student-1', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return active live room for enrolled student', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      mockPrisma.liveRoom.findFirst.mockResolvedValue({
        id: 'room-1',
        courseId: 'c-1',
        title: 'Active Lecture',
        isLive: true,
      });

      const result = await service.findActiveByCourse('c-1', 'student-1', UserRole.STUDENT);
      expect(result?.id).toBe('room-1');
    });
  });

  describe('generateToken', () => {
    it('should throw NotFoundException if room does not exist', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue(null);

      await expect(
        service.generateToken('room-999', {
          id: 'user-1',
          email: 'user@example.com',
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room is not live', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        isLive: false,
        course: { id: 'c-1', instructorId: 'inst-1' },
      });

      await expect(
        service.generateToken('room-1', {
          id: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if student is not enrolled in course', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        courseId: 'c-1',
        isLive: true,
        course: { id: 'c-1', instructorId: 'inst-1' },
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.generateToken('room-1', {
          id: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should generate a valid LiveKit JWT token for enrolled student', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        courseId: 'c-1',
        roomName: 'room-cs101-12345',
        isLive: true,
        course: { id: 'c-1', instructorId: 'inst-1' },
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      mockPrisma.attendanceRecord.upsert.mockResolvedValue({
        id: 'att-1',
        roomId: 'room-1',
        studentId: 'student-1',
        joinedAt: new Date(),
        status: 'PRESENT',
      });

      const result = await service.generateToken('room-1', {
        id: 'student-1',
        email: 'student@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: UserRole.STUDENT,
      });

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(20);
      expect(result.room.id).toBe('room-1');
      expect(result).toHaveProperty('wsUrl');
      expect(mockPrisma.attendanceRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            roomId_studentId: {
              roomId: 'room-1',
              studentId: 'student-1',
            },
          },
        }),
      );
    });

    it('should generate a valid LiveKit JWT token with roomAdmin grant for course instructor', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        courseId: 'c-1',
        roomName: 'room-cs101-12345',
        isLive: true,
        course: { id: 'c-1', instructorId: 'inst-1' },
      });

      const result = await service.generateToken('room-1', {
        id: 'inst-1',
        email: 'inst@example.com',
        firstName: 'Bob',
        lastName: 'Instructor',
        role: UserRole.INSTRUCTOR,
      });

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(20);
    });
  });

  describe('endRoom', () => {
    it('should throw NotFoundException if room does not exist', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue(null);

      await expect(
        service.endRoom('room-999', 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not instructor or admin', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        course: { id: 'c-1', instructorId: 'inst-1' },
      });

      await expect(
        service.endRoom('room-1', 'other-inst', UserRole.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should end room for instructor and mark isLive false', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        course: { id: 'c-1', instructorId: 'inst-1' },
      });
      mockPrisma.liveRoom.update.mockResolvedValue({
        id: 'room-1',
        isLive: false,
        endedAt: new Date(),
      });

      const result = await service.endRoom('room-1', 'inst-1', UserRole.INSTRUCTOR);
      expect(mockPrisma.liveRoom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'room-1' },
          data: expect.objectContaining({ isLive: false }),
        }),
      );
      expect(result.isLive).toBe(false);
    });
  });

  describe('recordHeartbeat', () => {
    it('should update leftAt and calculate durationMinutes for existing attendance record', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue({
        id: 'att-1',
        roomId: 'room-1',
        studentId: 'student-1',
        joinedAt: tenMinutesAgo,
        status: 'PRESENT',
      });
      mockPrisma.attendanceRecord.update.mockImplementation(({ data }: any) => ({
        id: 'att-1',
        ...data,
      }));

      const res = await service.recordHeartbeat('room-1', 'student-1');
      expect(mockPrisma.attendanceRecord.update).toHaveBeenCalled();
      expect(res.durationMinutes).toBeGreaterThanOrEqual(10);
    });
  });

  describe('recordLeave', () => {
    it('should update exit timestamp and finalize durationMinutes', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue({
        id: 'att-1',
        roomId: 'room-1',
        studentId: 'student-1',
        joinedAt: fiveMinutesAgo,
      });
      mockPrisma.attendanceRecord.update.mockImplementation(({ data }: any) => ({
        id: 'att-1',
        ...data,
      }));

      const res = await service.recordLeave('room-1', 'student-1');
      expect(mockPrisma.attendanceRecord.update).toHaveBeenCalled();
      expect(res?.durationMinutes).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getRoomAttendance', () => {
    it('should throw ForbiddenException if user is not course instructor or admin', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        course: { instructorId: 'inst-1' },
      });

      await expect(
        service.getRoomAttendance('room-1', 'other-inst', UserRole.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return attendance records for course instructor', async () => {
      mockPrisma.liveRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        title: 'Live Session 1',
        course: { id: 'c-1', instructorId: 'inst-1' },
      });
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          id: 'att-1',
          studentId: 'student-1',
          durationMinutes: 45,
          status: 'PRESENT',
          student: { firstName: 'Sam', lastName: 'Student', email: 'sam@test.com' },
        },
      ]);

      const res = await service.getRoomAttendance('room-1', 'inst-1', UserRole.INSTRUCTOR);
      expect(res.totalAttendees).toBe(1);
      expect(res.records[0].student.email).toBe('sam@test.com');
    });
  });

  describe('getCourseAttendanceForStudent', () => {
    it('should calculate overall attendance rate and return records', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'WebRTC Course',
        code: 'CS101',
        liveRooms: [{ id: 'room-1' }, { id: 'room-2' }],
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([
        {
          id: 'att-1',
          roomId: 'room-1',
          durationMinutes: 30,
          status: 'PRESENT',
          room: { id: 'room-1', title: 'Lecture 1' },
        },
      ]);

      const res = await service.getCourseAttendanceForStudent('c-1', 'student-1');
      expect(res.totalSessions).toBe(2);
      expect(res.attendedSessions).toBe(1);
      expect(res.attendancePercentage).toBe(50);
      expect(res.records.length).toBe(1);
    });
  });
});
