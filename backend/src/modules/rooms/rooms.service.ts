import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UserRole } from '@prisma/client';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: string, dto: CreateRoomDto, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole === UserRole.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only create rooms for courses you instruct');
    }

    // Close any existing active rooms for this course to ensure single active session
    await this.prisma.liveRoom.updateMany({
      where: {
        courseId,
        isLive: true,
      },
      data: {
        isLive: false,
        endedAt: new Date(),
      },
    });

    const sanitizedCode = course.code.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const roomName = `room-${sanitizedCode}-${Date.now()}`;

    return this.prisma.liveRoom.create({
      data: {
        courseId,
        title: dto.title,
        roomName,
        isLive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructorId: true,
          },
        },
      },
    });
  }

  async findActiveByCourse(courseId: string, userId: string, userRole: UserRole) {
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

      if (!enrollment || enrollment.status !== 'ACTIVE') {
        throw new ForbiddenException('You must be enrolled in this course to view active live rooms');
      }
    } else if (userRole === UserRole.INSTRUCTOR) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You are not the instructor for this course');
      }
    }

    return this.prisma.liveRoom.findFirst({
      where: {
        courseId,
        isLive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructorId: true,
          },
        },
      },
    });
  }

  async generateToken(
    roomId: string,
    user: { id: string; email: string; firstName?: string; lastName?: string; role: UserRole },
  ) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructorId: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Live room not found');
    }

    if (!room.isLive) {
      throw new BadRequestException('This live room session has ended');
    }

    if (user.role === UserRole.STUDENT) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: room.courseId,
            studentId: user.id,
          },
        },
      });

      if (!enrollment || enrollment.status !== 'ACTIVE') {
        throw new ForbiddenException('You must be enrolled in this course to join the live room');
      }

      // Automatically record attendance for student joining live classroom
      await this.prisma.attendanceRecord.upsert({
        where: {
          roomId_studentId: {
            roomId: room.id,
            studentId: user.id,
          },
        },
        update: {
          leftAt: null,
        },
        create: {
          roomId: room.id,
          studentId: user.id,
          joinedAt: new Date(),
          durationMinutes: 0,
          status: 'PRESENT',
        },
      });
    } else if (user.role === UserRole.INSTRUCTOR) {
      if (room.course.instructorId !== user.id) {
        throw new ForbiddenException('You are not authorized to join this room as instructor');
      }
    }

    const isInstructorOrAdmin =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      room.course.instructorId === user.id;

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: fullName,
    });

    at.addGrant({
      room: room.roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      roomAdmin: isInstructorOrAdmin,
    });

    const token = await at.toJwt();

    return {
      token,
      room,
      wsUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
    };
  }

  async endRoom(roomId: string, userId: string, userRole: UserRole) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructorId: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Live room not found');
    }

    const isInstructorOrAdmin =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      room.course.instructorId === userId;

    if (!isInstructorOrAdmin) {
      throw new ForbiddenException('Only the course instructor or an admin can end this session');
    }

    return this.prisma.liveRoom.update({
      where: { id: roomId },
      data: {
        isLive: false,
        endedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });
  }

  async findById(roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructorId: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Live room not found');
    }

    return room;
  }

  async recordHeartbeat(roomId: string, studentId: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: {
        roomId_studentId: {
          roomId,
          studentId,
        },
      },
    });

    if (!record) {
      return this.prisma.attendanceRecord.create({
        data: {
          roomId,
          studentId,
          joinedAt: new Date(),
          leftAt: new Date(),
          durationMinutes: 1,
          status: 'PRESENT',
        },
      });
    }

    const now = new Date();
    const durationMinutes = Math.max(1, Math.round((now.getTime() - record.joinedAt.getTime()) / 60000));

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        leftAt: now,
        durationMinutes,
      },
    });
  }

  async recordLeave(roomId: string, studentId: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: {
        roomId_studentId: {
          roomId,
          studentId,
        },
      },
    });

    if (!record) {
      return null;
    }

    const now = new Date();
    const durationMinutes = Math.max(1, Math.round((now.getTime() - record.joinedAt.getTime()) / 60000));

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        leftAt: now,
        durationMinutes,
      },
    });
  }

  async getRoomAttendance(roomId: string, userId: string, userRole: UserRole) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructorId: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Live room not found');
    }

    const isInstructorOrAdmin =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      room.course.instructorId === userId;

    if (!isInstructorOrAdmin) {
      throw new ForbiddenException('Only the course instructor or an admin can view room attendance');
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: { roomId },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return {
      room: {
        id: room.id,
        title: room.title,
        roomName: room.roomName,
        isLive: room.isLive,
        createdAt: room.createdAt,
        endedAt: room.endedAt,
        course: room.course,
      },
      totalAttendees: records.length,
      records,
    };
  }

  async getCourseAttendanceForStudent(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        liveRooms: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be enrolled in this course to view attendance records');
    }

    const roomIds = course.liveRooms.map((r) => r.id);
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        roomId: { in: roomIds },
        studentId,
      },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            endedAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const totalSessions = course.liveRooms.length;
    const attendedSessions = records.length;
    const attendancePercentage = totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 100)
      : 100;

    return {
      courseId,
      courseTitle: course.title,
      courseCode: course.code,
      totalSessions,
      attendedSessions,
      attendancePercentage,
      records,
    };
  }

  async getCourseAttendanceSessions(courseId: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const isInstructorOrAdmin =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      course.instructorId === userId;

    if (!isInstructorOrAdmin) {
      throw new ForbiddenException('Only the course instructor or an admin can view course attendance reports');
    }

    return this.prisma.liveRoom.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
          },
        },
        attendanceRecords: {
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
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
