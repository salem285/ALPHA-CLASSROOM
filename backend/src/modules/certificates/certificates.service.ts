import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoursesService } from '../courses/courses.service.js';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  private getCertificatesDirectory(): string {
    const dir = join(process.cwd(), 'uploads', 'certificates');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  async claimCertificate(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
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

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found.`);
    }

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'You must be actively enrolled in this course to claim a certificate.',
      );
    }

    // Check if certificate already claimed
    const existingCert = await this.prisma.certificate.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (existingCert) {
      throw new ConflictException(
        'Certificate has already been claimed for this course.',
      );
    }

    // Calculate student progress
    const progress = await this.coursesService.calculateStudentProgress(
      courseId,
      studentId,
    );

    if (progress.overallPercentage < 80) {
      throw new BadRequestException(
        `Course completion progress is only ${progress.overallPercentage}%. A minimum of 80% is required to claim an official certificate.`,
      );
    }

    // Generate unique certificate code
    const uniqueHash = randomBytes(4).toString('hex').toUpperCase();
    const certificateCode = `ALPHA-CERT-${Date.now().toString(36).toUpperCase()}-${uniqueHash}`;

    // Frontend verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const verificationUrl = `${frontendUrl}/verify-certificate/${certificateCode}`;

    const studentFullName = `${student.firstName} ${student.lastName}`;
    const instructorFullName = `${course.instructor.firstName} ${course.instructor.lastName}`;
    const issuedAt = new Date();

    // Generate PDF Buffer
    const pdfBuffer = await this.generateCertificatePdf(
      certificateCode,
      studentFullName,
      course.title,
      course.code,
      instructorFullName,
      progress.overallPercentage,
      issuedAt,
      verificationUrl,
    );

    // Save PDF file in uploads/certificates/
    const certDir = this.getCertificatesDirectory();
    const fileName = `${certificateCode}.pdf`;
    const filePath = join(certDir, fileName);
    writeFileSync(filePath, pdfBuffer);

    const pdfUrl = `/uploads/certificates/${fileName}`;

    // Store in DB
    const certificate = await this.prisma.certificate.create({
      data: {
        certificateCode,
        courseId,
        studentId,
        gradePercentage: progress.overallPercentage,
        pdfUrl,
        issuedAt,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Certificate claimed and generated successfully!',
      certificate,
    };
  }

  async getMyCertificate(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

    const certificate = await this.prisma.certificate.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (certificate) {
      return {
        isEligible: true,
        isClaimed: true,
        currentProgress: certificate.gradePercentage,
        requiredProgress: 80,
        certificate,
      };
    }

    const progress = await this.coursesService.calculateStudentProgress(
      courseId,
      studentId,
    );

    return {
      isEligible: progress.overallPercentage >= 80,
      isClaimed: false,
      currentProgress: progress.overallPercentage,
      requiredProgress: 80,
      certificate: null,
    };
  }

  async verifyCertificate(certificateCode: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateCode },
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
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException(
        `Certificate with verification code "${certificateCode}" was not found or is invalid.`,
      );
    }

    return {
      isValid: true,
      certificateCode: certificate.certificateCode,
      studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
      studentEmail: certificate.student.email,
      courseTitle: certificate.course.title,
      courseCode: certificate.course.code,
      instructorName: `${certificate.course.instructor.firstName} ${certificate.course.instructor.lastName}`,
      gradePercentage: certificate.gradePercentage,
      issuedAt: certificate.issuedAt,
      pdfUrl: certificate.pdfUrl,
    };
  }

  async getCertificateFile(certificateCode: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateCode },
    });

    if (!certificate) {
      throw new NotFoundException(
        `Certificate with code "${certificateCode}" was not found.`,
      );
    }

    const certDir = this.getCertificatesDirectory();
    const filePath = join(certDir, `${certificateCode}.pdf`);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Certificate PDF document file was not found on server.');
    }

    return {
      filePath,
      certificateCode: certificate.certificateCode,
    };
  }

  private async generateCertificatePdf(
    certificateCode: string,
    studentName: string,
    courseTitle: string,
    courseCode: string,
    instructorName: string,
    gradePercentage: number,
    issuedAt: Date,
    verificationUrl: string,
  ): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;
      const height = doc.page.height;

      // 1. Background fill
      doc.rect(0, 0, width, height).fill('#FAFAFE');

      // 2. Decorative borders
      doc.rect(20, 20, width - 40, height - 40).lineWidth(4).stroke('#3B0764'); // Deep purple
      doc.rect(26, 26, width - 52, height - 52).lineWidth(1).stroke('#7C3AED'); // Violet accent
      doc.rect(30, 30, width - 60, height - 60).lineWidth(0.5).stroke('#DDD6FE'); // Soft lilac

      // Corner accent blocks
      const cornerSize = 24;
      doc.rect(20, 20, cornerSize, cornerSize).fill('#581C87');
      doc.rect(width - 20 - cornerSize, 20, cornerSize, cornerSize).fill('#581C87');
      doc.rect(20, height - 20 - cornerSize, cornerSize, cornerSize).fill('#581C87');
      doc.rect(width - 20 - cornerSize, height - 20 - cornerSize, cornerSize, cornerSize).fill('#581C87');

      // 3. Institution Branding
      doc
        .fillColor('#6D28D9')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('ALPHA CODING ACADEMY  •  OFFICIAL ACCREDITATION', 0, 58, {
          align: 'center',
          characterSpacing: 2,
        });

      // 4. Certificate Title
      doc
        .fillColor('#1E1B4B')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 0, 84, {
          align: 'center',
          characterSpacing: 1.5,
        });

      // 5. Conferred Subtitle
      doc
        .fillColor('#6B7280')
        .fontSize(11)
        .font('Helvetica')
        .text('THIS IS PROUDLY CONFERRED UPON', 0, 130, {
          align: 'center',
          characterSpacing: 1.5,
        });

      // 6. Recipient Name
      doc
        .fillColor('#0F172A')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(studentName, 0, 155, {
          align: 'center',
        });

      // Decorative underline beneath student name
      const lineMargin = 220;
      doc
        .moveTo(lineMargin, 192)
        .lineTo(width - lineMargin, 192)
        .lineWidth(2)
        .stroke('#7C3AED');

      // 7. Academic accomplishment description
      doc
        .fillColor('#374151')
        .fontSize(11)
        .font('Helvetica')
        .text(
          'for successfully demonstrating outstanding mastery, completing all curriculum requirements, assignments, examinations, and live sessions for the accredited specialization:',
          110,
          212,
          {
            align: 'center',
            width: width - 220,
            lineGap: 4,
          },
        );

      // 8. Course Title & Code
      doc
        .fillColor('#4338CA')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(`${courseTitle} (${courseCode})`, 0, 268, {
          align: 'center',
        });

      // 9. Academic Honors / Score
      doc
        .fillColor('#059669')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(
          `Academic Standing: ${gradePercentage}% Completion & Mastery Score`,
          0,
          305,
          {
            align: 'center',
          },
        );

      // 10. Bottom Row: Signatures & Verification Details
      const bottomY = 425;

      // Left Column: Instructor Signature Line
      const leftColX = 90;
      doc.moveTo(leftColX, bottomY).lineTo(leftColX + 180, bottomY).lineWidth(1).stroke('#9CA3AF');
      doc
        .fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(instructorName, leftColX, bottomY + 8, {
          width: 180,
          align: 'center',
        });
      doc
        .fillColor('#6B7280')
        .fontSize(9)
        .font('Helvetica')
        .text('Lead Academic Instructor', leftColX, bottomY + 24, {
          width: 180,
          align: 'center',
        });

      // Center Column: Date and Official Registry Seal
      const formattedDate = issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc
        .fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`ISSUED: ${formattedDate}`, 0, bottomY + 6, {
          align: 'center',
        });
      doc
        .fillColor('#6B7280')
        .fontSize(9)
        .font('Helvetica')
        .text('Alpha Classroom Registry Seal', 0, bottomY + 22, {
          align: 'center',
        });

      // Right Column: QR Code & Verification Code
      const qrX = width - 180;
      doc.image(qrBuffer, qrX, bottomY - 45, { width: 75 });
      doc
        .fillColor('#4B5563')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text(certificateCode, qrX - 30, bottomY + 36, {
          width: 135,
          align: 'center',
        });
      doc
        .fillColor('#9CA3AF')
        .fontSize(7)
        .font('Helvetica')
        .text('Scan QR to verify on portal', qrX - 30, bottomY + 48, {
          width: 135,
          align: 'center',
        });

      // 11. Footer Notice
      doc
        .fillColor('#9CA3AF')
        .fontSize(7.5)
        .font('Helvetica')
        .text(
          'Digitally signed and cryptographically verifiable on ALPHA CLASSROOM. All rights reserved.',
          0,
          height - 36,
          {
            align: 'center',
          },
        );

      doc.end();
    });
  }
}
