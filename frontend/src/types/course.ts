export interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  accessCode?: string;
  instructorId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    enrollments: number;
  };
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: string;
  enrolledAt: string;
  course: Course;
}
