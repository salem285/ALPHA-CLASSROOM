export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: 'PDF' | 'ZIP' | 'DOC' | 'OTHER' | string;
  sizeBytes: number;
  createdAt: string;
}

export interface StudentCourseProgress {
  overallPercentage: number;
  completedAssignments: number;
  totalAssignments: number;
  completedExams: number;
  totalExams: number;
  attendanceRate: number;
}
