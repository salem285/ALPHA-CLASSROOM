import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { EnrollCourseDto } from './dto/enroll-course.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.create(dto, user.id, user.role);
  }

  @Get()
  async findAll() {
    return this.coursesService.findAll(true);
  }

  @Get('my/teaching')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findTeaching(@CurrentUser('id') instructorId: string) {
    return this.coursesService.findTeaching(instructorId);
  }

  @Get('my/enrolled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findEnrolled(@CurrentUser('id') studentId: string) {
    return this.coursesService.findEnrolled(studentId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAllForAdmin() {
    return this.coursesService.findAllForAdmin();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async enroll(
    @Param('id') courseId: string,
    @Body() dto: EnrollCourseDto,
    @CurrentUser('id') studentId: string,
  ) {
    return this.coursesService.enroll(courseId, studentId, dto);
  }
}
