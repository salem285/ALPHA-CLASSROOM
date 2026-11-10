import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleDriveService } from '../storage/google-drive.service.js';
import { CreateMaterialDto } from './dto/create-material.dto.js';
import { UserRole } from '@prisma/client';
import { join, extname } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';

const uploadDirectory = join(process.cwd(), 'uploads', 'materials');

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  private formatMaterial(material: any) {
    if (!material) return null;
    return {
      ...material,
      sizeBytes: Number(material.sizeBytes || 0),
    };
  }

  detectFileType(originalName: string, mimeType?: string): string {
    const ext = extname(originalName).toLowerCase();
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      return 'PDF';
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
      return 'ZIP';
    }
    if (
      ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.odt'].includes(
        ext,
      )
    ) {
      return 'DOC';
    }
    return 'OTHER';
  }

  async create(
    courseId: string,
    file: Express.Multer.File,
    dto: CreateMaterialDto,
    userId: string,
    userRole: UserRole,
  ) {
    if (!file) {
      throw new BadRequestException('A course material file is required');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && course.instructorId !== userId) {
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      throw new ForbiddenException('You can only upload materials to your own courses');
    }

    const fileType = this.detectFileType(file.originalname, file.mimetype);
    let fileUrl = `/uploads/materials/${file.filename}`;
    let driveFileId: string | null = null;
    let sizeBytes = BigInt(file.size || 0);

    if (this.googleDriveService?.isConfigured()) {
      try {
        const driveResult = await this.googleDriveService.uploadFile(file, 'Materials');
        driveFileId = driveResult.fileId;
        fileUrl = driveResult.webContentLink || driveResult.webViewLink || driveResult.previewUrl;
        if (driveResult.sizeBytes) {
          sizeBytes = BigInt(driveResult.sizeBytes);
        }
      } catch (driveErr) {
        console.warn('[MaterialsService] Google Drive upload failed, falling back to local disk:', driveErr);
      }
    }

    const material = await this.prisma.courseMaterial.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description || null,
        fileUrl,
        fileName: file.filename,
        fileType,
        sizeBytes,
        driveFileId,
      },
    });

    return this.formatMaterial(material);
  }

  async findByCourse(courseId: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
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
        throw new ForbiddenException('You must be enrolled in this course to access its materials');
      }
    }

    const materials = await this.prisma.courseMaterial.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });

    return materials.map((m) => this.formatMaterial(m));
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!material) {
      throw new NotFoundException(`Course material with ID ${id} not found`);
    }

    if (userRole === UserRole.INSTRUCTOR && material.course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete materials from your own courses');
    }

    // Delete file from Google Drive if present
    if (material.driveFileId && this.googleDriveService?.isConfigured()) {
      try {
        await this.googleDriveService.deleteFile(material.driveFileId);
      } catch (err) {
        console.warn(`[MaterialsService] Failed to delete file ${material.driveFileId} from Google Drive:`, err);
      }
    }

    // Unlink physical file
    const filePath = join(uploadDirectory, material.fileName);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // ignore unlink error
      }
    }

    await this.prisma.courseMaterial.delete({
      where: { id },
    });

    return { message: 'Material deleted successfully' };
  }
}
