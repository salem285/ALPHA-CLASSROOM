export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: 'SUBMITTED' | 'GRADED';
  submittedAt: string;
  gradedAt: string | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
  submissions?: Submission[];
  _count?: {
    submissions: number;
  };
}
