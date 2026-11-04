import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { AddQuestionDto } from './dto/add-question.dto.js';
import { SubmitExamDto } from './dto/submit-exam.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('courses/:courseId/exams')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examsService.create(courseId, dto, user.id, user.role);
  }

  @Post('exams/:id/questions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async addQuestion(
    @Param('id') examId: string,
    @Body() dto: AddQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.examsService.addQuestion(examId, dto, user.id, user.role);
  }

  @Get('courses/:courseId/exams')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.findByCourse(courseId, user.id, user.role);
  }

  @Get('exams/:id/take')
  @Roles(UserRole.STUDENT)
  async takeExam(
    @Param('id') examId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.examsService.takeExam(examId, studentId);
  }

  @Post('exams/:id/submit')
  @Roles(UserRole.STUDENT)
  async submitExam(
    @Param('id') examId: string,
    @Body() dto: SubmitExamDto,
    @CurrentUser('id') studentId: string,
  ) {
    return this.examsService.submitExam(examId, dto, studentId);
  }

  @Get('exams/:id/results')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findExamResults(
    @Param('id') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.findExamResults(examId, user.id, user.role);
  }

  @Get('exams/:id/my-result')
  @Roles(UserRole.STUDENT)
  async getMyResult(
    @Param('id') examId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.examsService.getMyResult(examId, studentId);
  }
}
