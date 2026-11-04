export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: string;
  points: number;
  options: QuestionOption[];
  correctAnswer?: string; // only present in instructor view
  orderIndex: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string> | null;
  score: number | null;
  isPassed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_GRADED';
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  passingScore: number;
  totalScore: number;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  attempts?: ExamAttempt[];
  _count?: {
    questions: number;
    attempts: number;
  };
}
