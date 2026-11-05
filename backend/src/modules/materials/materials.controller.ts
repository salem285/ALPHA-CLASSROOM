import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { MaterialsService } from './materials.service.js';
import { CreateMaterialDto } from './dto/create-material.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

const uploadDirectory = join(process.cwd(), 'uploads', 'materials');
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

export const materialStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `mat-${uniqueSuffix}${ext}`);
  },
});

@Controller()
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('courses/:courseId/materials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: materialStorage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (_req, file, cb) => {
        const allowedExtensions = /\.(pdf|zip|rar|7z|tar|gz|doc|docx|ppt|pptx|xls|xlsx|txt)$/i;
        if (!file.originalname.match(allowedExtensions)) {
          return cb(
            new BadRequestException(
              'Unsupported file format. Allowed formats: PDF, ZIP, RAR, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadMaterial(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMaterialDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.materialsService.create(courseId, file, dto, userId, userRole);
  }

  @Get('courses/:courseId/materials')
  @UseGuards(JwtAuthGuard)
  async getMaterials(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.materialsService.findByCourse(courseId, userId, userRole);
  }

  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteMaterial(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.materialsService.delete(id, userId, userRole);
  }
}
