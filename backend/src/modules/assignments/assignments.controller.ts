import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('courses/:courseId/assignments')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.create(courseId, dto, user.id, user.role);
  }

  @Get('courses/:courseId/assignments')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.findByCourse(courseId, user.id, user.role);
  }

  @Post('assignments/:id/submit')
  @Roles(UserRole.STUDENT)
  async submit(
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser('id') studentId: string,
  ) {
    return this.assignmentsService.submit(assignmentId, dto, studentId);
  }

  @Get('assignments/:id/submissions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findSubmissions(
    @Param('id') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.findSubmissions(assignmentId, user.id, user.role);
  }

  @Patch('submissions/:id/grade')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async grade(
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, dto, user.id, user.role);
  }
}
