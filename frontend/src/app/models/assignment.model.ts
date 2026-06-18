export interface Assignment {
  _id: string;
  course: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxGrade: number;
  fileUrl: string | null;
  fileName: string | null;
  topic: string;
  createdAt: string;
}

export interface NewAssignment {
  courseId: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  maxGrade?: number;
  fileUrl?: string | null;
  fileName?: string | null;
  topic?: string;
}
