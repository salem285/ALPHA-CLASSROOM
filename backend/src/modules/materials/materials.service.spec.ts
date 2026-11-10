import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaterialsService } from './materials.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('MaterialsService', () => {
  let materialsService: MaterialsService;
  let mockPrisma: any;
  let mockGoogleDrive: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
      courseMaterial: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockGoogleDrive = {
      isConfigured: vi.fn().mockReturnValue(false),
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
    };

    materialsService = new MaterialsService(mockPrisma as any, mockGoogleDrive as any);
  });

  describe('detectFileType', () => {
    it('should classify pdf files as PDF', () => {
      expect(materialsService.detectFileType('syllabus.pdf')).toBe('PDF');
    });

    it('should classify zip and archive files as ZIP', () => {
      expect(materialsService.detectFileType('project.zip')).toBe('ZIP');
      expect(materialsService.detectFileType('code.tar.gz')).toBe('ZIP');
    });

    it('should classify office docs as DOC', () => {
      expect(materialsService.detectFileType('notes.docx')).toBe('DOC');
      expect(materialsService.detectFileType('slides.pptx')).toBe('DOC');
    });

    it('should classify other files as OTHER', () => {
      expect(materialsService.detectFileType('data.iso')).toBe('OTHER');
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        materialsService.create('course-1', null as any, { title: 'Notes' }, 'user-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      const fakeFile: any = { originalname: 'doc.pdf', filename: 'mat-1.pdf', size: 1024, mimetype: 'application/pdf' };

      await expect(
        materialsService.create('course-1', fakeFile, { title: 'Notes' }, 'user-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create material and serialize BigInt sizeBytes to Number', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.courseMaterial.create.mockResolvedValue({
        id: 'mat-id-1',
        courseId: 'c-1',
        title: 'Lecture 1 Slides',
        fileUrl: '/uploads/materials/mat-1.pdf',
        fileName: 'mat-1.pdf',
        fileType: 'PDF',
        sizeBytes: BigInt(2048),
        createdAt: new Date(),
      });

      const fakeFile: any = {
        originalname: 'lecture1.pdf',
        filename: 'mat-1.pdf',
        size: 2048,
        mimetype: 'application/pdf',
      };

      const result = await materialsService.create(
        'c-1',
        fakeFile,
        { title: 'Lecture 1 Slides' },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(result.id).toBe('mat-id-1');
      expect(result.fileType).toBe('PDF');
      expect(result.sizeBytes).toBe(2048);
      expect(typeof result.sizeBytes).toBe('number');
    });

    it('should upload material to Google Drive when configured', async () => {
      mockGoogleDrive.isConfigured.mockReturnValue(true);
      mockGoogleDrive.uploadFile.mockResolvedValue({
        fileId: 'drive-mat-1',
        webViewLink: 'https://drive.google.com/file/d/drive-mat-1/view',
        webContentLink: 'https://drive.google.com/uc?id=drive-mat-1',
        previewUrl: 'https://drive.google.com/file/d/drive-mat-1/preview',
        sizeBytes: 4096,
      });

      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1', instructorId: 'inst-1' });
      mockPrisma.courseMaterial.create.mockResolvedValue({
        id: 'mat-cloud-1',
        courseId: 'c-1',
        title: 'Cloud Document',
        fileUrl: 'https://drive.google.com/uc?id=drive-mat-1',
        fileName: 'doc.pdf',
        fileType: 'PDF',
        driveFileId: 'drive-mat-1',
        sizeBytes: BigInt(4096),
        createdAt: new Date(),
      });

      const fakeFile: any = {
        originalname: 'doc.pdf',
        filename: 'mat-doc.pdf',
        size: 4096,
        mimetype: 'application/pdf',
      };

      const result = await materialsService.create(
        'c-1',
        fakeFile,
        { title: 'Cloud Document' },
        'inst-1',
        UserRole.INSTRUCTOR,
      );

      expect(mockGoogleDrive.uploadFile).toHaveBeenCalledWith(fakeFile, 'Materials');
      expect(result.driveFileId).toBe('drive-mat-1');
      expect(mockPrisma.courseMaterial.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            driveFileId: 'drive-mat-1',
          }),
        }),
      );
    });
  });

  describe('findByCourse', () => {
    it('should throw ForbiddenException if student is not enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        materialsService.findByCourse('c-1', 'student-1', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return materials list when student is enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      mockPrisma.courseMaterial.findMany.mockResolvedValue([
        {
          id: 'm-1',
          title: 'Lab 1',
          fileName: 'mat-lab1.zip',
          fileType: 'ZIP',
          sizeBytes: BigInt(5000),
          createdAt: new Date(),
        },
      ]);

      const list = await materialsService.findByCourse('c-1', 'student-1', UserRole.STUDENT);
      expect(list.length).toBe(1);
      expect(list[0].sizeBytes).toBe(5000);
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException if instructor does not own course', async () => {
      mockPrisma.courseMaterial.findUnique.mockResolvedValue({
        id: 'm-1',
        course: { instructorId: 'other-instructor' },
      });

      await expect(
        materialsService.delete('m-1', 'inst-1', UserRole.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete material record when authorized', async () => {
      mockPrisma.courseMaterial.findUnique.mockResolvedValue({
        id: 'm-1',
        fileName: 'mat-test.pdf',
        course: { instructorId: 'inst-1' },
      });
      mockPrisma.courseMaterial.delete.mockResolvedValue({ id: 'm-1' });

      const res = await materialsService.delete('m-1', 'inst-1', UserRole.INSTRUCTOR);
      expect(res.message).toContain('deleted successfully');
    });

    it('should delete file from Google Drive when driveFileId exists and drive is configured', async () => {
      mockGoogleDrive.isConfigured.mockReturnValue(true);
      mockGoogleDrive.deleteFile.mockResolvedValue(true);

      mockPrisma.courseMaterial.findUnique.mockResolvedValue({
        id: 'm-drive-1',
        fileName: 'mat-test.pdf',
        driveFileId: 'drive-mat-999',
        course: { instructorId: 'inst-1' },
      });
      mockPrisma.courseMaterial.delete.mockResolvedValue({ id: 'm-drive-1' });

      const res = await materialsService.delete('m-drive-1', 'inst-1', UserRole.INSTRUCTOR);
      expect(mockGoogleDrive.deleteFile).toHaveBeenCalledWith('drive-mat-999');
      expect(res.message).toContain('deleted successfully');
    });
  });
});
