import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CertificatesService } from './certificates.service.js';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let mockPrisma: any;
  let mockCoursesService: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
      certificate: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    mockCoursesService = {
      calculateStudentProgress: vi.fn(),
    };

    service = new CertificatesService(
      mockPrisma as any,
      mockCoursesService as any,
    );
  });

  describe('claimCertificate', () => {
    it('should throw NotFoundException if course is not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.claimCertificate('non-existent', 'student-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student is not actively enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Full Stack',
        instructor: { firstName: 'Prof', lastName: 'X' },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 's-1',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.claimCertificate('c-1', 's-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if certificate has already been claimed', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Full Stack',
        instructor: { firstName: 'Prof', lastName: 'X' },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 's-1',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'e-1',
        status: 'ACTIVE',
      });
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        certificateCode: 'ALPHA-CERT-EXISTING',
      });

      await expect(service.claimCertificate('c-1', 's-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if student progress is below 80%', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Full Stack',
        code: 'CS101',
        instructor: { firstName: 'Prof', lastName: 'X' },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 's-1',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'e-1',
        status: 'ACTIVE',
      });
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      mockCoursesService.calculateStudentProgress.mockResolvedValue({
        overallPercentage: 65,
      });

      await expect(service.claimCertificate('c-1', 's-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully generate and save certificate when progress is >= 80%', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Full Stack',
        code: 'CS101',
        instructor: { firstName: 'Prof', lastName: 'X' },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 's-1',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'e-1',
        status: 'ACTIVE',
      });
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      mockCoursesService.calculateStudentProgress.mockResolvedValue({
        overallPercentage: 90,
      });

      mockPrisma.certificate.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'cert-new',
          certificateCode: data.certificateCode,
          courseId: data.courseId,
          studentId: data.studentId,
          gradePercentage: data.gradePercentage,
          pdfUrl: data.pdfUrl,
          issuedAt: data.issuedAt,
          course: { title: 'Full Stack', code: 'CS101' },
          student: { firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
        }),
      );

      const res = await service.claimCertificate('c-1', 's-1');
      expect(res.certificate).toBeDefined();
      expect(res.certificate.gradePercentage).toBe(90);
      expect(res.certificate.certificateCode).toContain('ALPHA-CERT-');
      expect(res.certificate.pdfUrl).toContain('/uploads/certificates/');
      expect(mockPrisma.certificate.create).toHaveBeenCalled();
    });
  });

  describe('getMyCertificate', () => {
    it('should return existing certificate if already claimed', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        certificateCode: 'ALPHA-CERT-123',
        gradePercentage: 85,
      });

      const res = await service.getMyCertificate('c-1', 's-1');
      expect(res.isClaimed).toBe(true);
      expect(res.isEligible).toBe(true);
      expect(res.certificate?.certificateCode).toBe('ALPHA-CERT-123');
    });

    it('should return eligibility false when progress is below 80% and not claimed', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      mockCoursesService.calculateStudentProgress.mockResolvedValue({
        overallPercentage: 50,
      });

      const res = await service.getMyCertificate('c-1', 's-1');
      expect(res.isClaimed).toBe(false);
      expect(res.isEligible).toBe(false);
      expect(res.currentProgress).toBe(50);
      expect(res.certificate).toBeNull();
    });

    it('should return eligibility true when progress is >= 80% and not yet claimed', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      mockCoursesService.calculateStudentProgress.mockResolvedValue({
        overallPercentage: 85,
      });

      const res = await service.getMyCertificate('c-1', 's-1');
      expect(res.isClaimed).toBe(false);
      expect(res.isEligible).toBe(true);
      expect(res.currentProgress).toBe(85);
      expect(res.certificate).toBeNull();
    });
  });

  describe('verifyCertificate', () => {
    it('should throw NotFoundException if certificate code does not exist', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyCertificate('INVALID-CODE'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return public verification details for a valid certificate', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        certificateCode: 'ALPHA-CERT-TEST',
        gradePercentage: 92,
        issuedAt: new Date('2026-11-05T12:00:00Z'),
        pdfUrl: '/uploads/certificates/ALPHA-CERT-TEST.pdf',
        course: {
          title: 'Advanced AI & Full Stack',
          code: 'CS102',
          instructor: {
            firstName: 'Alan',
            lastName: 'Turing',
            email: 'alan@alphacoding.com',
          },
        },
        student: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@alphacoding.com',
        },
      });

      const res = await service.verifyCertificate('ALPHA-CERT-TEST');
      expect(res.isValid).toBe(true);
      expect(res.studentName).toBe('Ada Lovelace');
      expect(res.courseTitle).toBe('Advanced AI & Full Stack');
      expect(res.instructorName).toBe('Alan Turing');
      expect(res.gradePercentage).toBe(92);
    });
  });
});
