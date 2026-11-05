import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { CertificatesService } from './certificates.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // -------------------------------------------------------------
  // Student Certificate Claim & Status Endpoints
  // -------------------------------------------------------------

  @Post('courses/:courseId/certificates/claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async claimCertificate(
    @Param('courseId') courseId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.certificatesService.claimCertificate(courseId, studentId);
  }

  @Get('courses/:courseId/certificates/my-certificate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMyCertificate(
    @Param('courseId') courseId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.certificatesService.getMyCertificate(courseId, studentId);
  }

  // -------------------------------------------------------------
  // Public Verification & Download Endpoints (No Auth Required)
  // -------------------------------------------------------------

  @Get('certificates/verify/:certificateCode')
  async verifyCertificate(@Param('certificateCode') certificateCode: string) {
    return this.certificatesService.verifyCertificate(certificateCode);
  }

  @Get('certificates/download/:certificateCode')
  async downloadCertificate(
    @Param('certificateCode') certificateCode: string,
    @Res() res: Response,
  ) {
    const { filePath } =
      await this.certificatesService.getCertificateFile(certificateCode);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${certificateCode}.pdf"`,
    );

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
