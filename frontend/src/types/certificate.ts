export interface Certificate {
  id: string;
  certificateCode: string;
  courseId: string;
  studentId: string;
  issuedAt: string;
  gradePercentage: number;
  pdfUrl?: string | null;
  course?: {
    id: string;
    title: string;
    code: string;
    instructor?: {
      firstName: string;
      lastName: string;
    };
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface MyCertificateResponse {
  isEligible: boolean;
  isClaimed: boolean;
  currentProgress: number;
  requiredProgress: number;
  certificate: Certificate | null;
}

export interface VerifyCertificateResponse {
  isValid: boolean;
  certificateCode: string;
  studentName: string;
  studentEmail?: string;
  courseTitle: string;
  courseCode: string;
  instructorName: string;
  gradePercentage: number;
  issuedAt: string;
  pdfUrl?: string | null;
}
