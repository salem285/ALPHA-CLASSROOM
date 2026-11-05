export interface DiscussionPost {
  id: string;
  courseId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  replies?: DiscussionPost[];
}
