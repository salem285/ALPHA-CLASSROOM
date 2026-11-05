import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { EnrollCourseDto } from './dto/enroll-course.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto, currentUserId: string, currentUserRole: string) {
    const cleanCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.course.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      throw new ConflictException(`Course with code "${cleanCode}" already exists.`);
    }

    let assignedInstructorId = currentUserId;
    if (currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN) {
      if (dto.instructorId) {
        assignedInstructorId = dto.instructorId;
      }
    }

    let accessCode = dto.accessCode?.trim().toUpperCase();
    if (!accessCode) {
      accessCode = 'ALPHA-2026';
    }

    return this.prisma.course.create({
      data: {
        title: dto.title.trim(),
        code: cleanCode,
        description: dto.description?.trim(),
        accessCode,
        instructorId: assignedInstructorId,
        isPublished: dto.isPublished ?? true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(isPublished = true) {
    return this.prisma.course.findMany({
      where: isPublished ? { isPublished: true } : {},
      select: {
        id: true,
        title: true,
        code: true,
        description: true,
        instructorId: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        code: true,
        description: true,
        instructorId: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found.`);
    }

    return course;
  }

  async enroll(courseId: string, studentId: string, dto: EnrollCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    if (!course.isPublished) {
      throw new BadRequestException('This course is not open for enrollment.');
    }

    if (!dto?.accessCode || dto.accessCode.trim().toUpperCase() !== course.accessCode.trim().toUpperCase()) {
      throw new BadRequestException('Invalid Access Code. Please request the enrollment key from the course instructor.');
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this course.');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId,
        studentId,
        status: 'ACTIVE',
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

    return {
      message: `Successfully enrolled in ${enrollment.course.title}`,
      enrollment,
    };
  }

  async findTeaching(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findEnrolled(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async findAllForAdmin() {
    return this.prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async calculateStudentProgress(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
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
      throw new ForbiddenException('You must be enrolled in this course to view progress');
    }

    const totalAssignments = await this.prisma.assignment.count({
      where: { courseId },
    });

    const completedAssignments = await this.prisma.submission.count({
      where: {
        assignment: { courseId },
        studentId,
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
    });

    const assignmentRatio =
      totalAssignments > 0 ? completedAssignments / totalAssignments : 1;

    const totalExams = await this.prisma.exam.count({
      where: { courseId, isPublished: true },
    });

    const completedExams = await this.prisma.examAttempt.count({
      where: {
        exam: { courseId },
        studentId,
        status: 'SUBMITTED',
      },
    });

    const examRatio = totalExams > 0 ? completedExams / totalExams : 1;

    const totalSessions = await this.prisma.liveRoom.count({
      where: { courseId },
    });

    const attendedSessions = await this.prisma.attendanceRecord.count({
      where: {
        room: { courseId },
        studentId,
      },
    });

    const attendanceRate =
      totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

    const attendanceRatio = attendanceRate / 100;

    const rawPercentage = Math.round(
      assignmentRatio * 40 + examRatio * 40 + attendanceRatio * 20,
    );
    const overallPercentage = Math.min(100, Math.max(0, rawPercentage));

    return {
      overallPercentage,
      completedAssignments,
      totalAssignments,
      completedExams,
      totalExams,
      attendanceRate,
    };
  }

  async exportGradesCsv(courseId: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: { student: true },
          orderBy: { enrolledAt: 'asc' },
        },
        assignments: {
          include: { submissions: true },
        },
        exams: {
          include: { attempts: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only export reports for your own courses');
    }

    const headers = [
      'Student Name',
      'Email',
      'Assignments Completed',
      'Assignments Average Score',
      'Exams Completed',
      'Exams Average Score',
      'Overall Average Score',
    ];

    const rows: string[] = [];
    rows.push(headers.join(','));

    for (const enrollment of course.enrollments) {
      const student = enrollment.student;

      const studentSubmissions = course.assignments.flatMap((a) =>
        a.submissions.filter((s) => s.studentId === student.id),
      );
      const gradedSubmissions = studentSubmissions.filter(
        (s) => s.score !== null && s.score !== undefined,
      );
      const avgAssignmentScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) /
            gradedSubmissions.length
          : 0;

      const studentAttempts = course.exams.flatMap((e) =>
        e.attempts.filter(
          (a) => a.studentId === student.id && a.score !== null && a.score !== undefined,
        ),
      );
      const avgExamScore =
        studentAttempts.length > 0
          ? studentAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) /
            studentAttempts.length
          : 0;

      let overallAvg = 0;
      if (gradedSubmissions.length > 0 && studentAttempts.length > 0) {
        overallAvg = Math.round(((avgAssignmentScore + avgExamScore) / 2) * 10) / 10;
      } else if (gradedSubmissions.length > 0) {
        overallAvg = Math.round(avgAssignmentScore * 10) / 10;
      } else if (studentAttempts.length > 0) {
        overallAvg = Math.round(avgExamScore * 10) / 10;
      }

      rows.push(
        [
          `"${(student.firstName + ' ' + student.lastName).replace(/"/g, '""')}"`,
          `"${student.email}"`,
          `${studentSubmissions.length}/${course.assignments.length}`,
          avgAssignmentScore.toFixed(1),
          `${studentAttempts.length}/${course.exams.length}`,
          avgExamScore.toFixed(1),
          overallAvg.toFixed(1),
        ].join(','),
      );
    }

    return {
      filename: `course_${course.code}_grades.csv`,
      csv: rows.join('\r\n'),
    };
  }

  async exportAttendanceCsv(courseId: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        liveRooms: {
          include: {
            attendanceRecords: {
              include: { student: true },
              orderBy: { joinedAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only export reports for your own courses');
    }

    const headers = [
      'Student Name',
      'Email',
      'Session Room',
      'Session Date',
      'Status',
      'Joined At',
      'Left At',
      'Duration (Minutes)',
    ];

    const rows: string[] = [];
    rows.push(headers.join(','));

    for (const room of course.liveRooms) {
      for (const record of room.attendanceRecords) {
        const student = record.student;
        const studentName = `"${(student.firstName + ' ' + student.lastName).replace(/"/g, '""')}"`;
        const roomTitle = `"${room.title.replace(/"/g, '""')}"`;
        const dateStr = record.joinedAt.toISOString().slice(0, 10);
        const joinedAtStr = record.joinedAt.toISOString();
        const leftAtStr = record.leftAt ? record.leftAt.toISOString() : 'N/A';

        rows.push(
          [
            studentName,
            `"${student.email}"`,
            roomTitle,
            dateStr,
            record.status,
            joinedAtStr,
            leftAtStr,
            record.durationMinutes,
          ].join(','),
        );
      }
    }

    return {
      filename: `course_${course.code}_attendance.csv`,
      csv: rows.join('\r\n'),
    };
  }
}
