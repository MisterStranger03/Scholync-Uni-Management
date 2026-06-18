export interface Course {
  _id: string;
  name: string;
  code: string;
  description: string;
  university: string;
  professor: { _id: string; name: string; email: string };
  students: { _id: string; name: string; email: string }[];
  capacity: number | null;
  createdAt: string;
}

export interface NewCourse {
  name: string;
  code: string;
  description?: string;
  professorId?: string;
  capacity?: number | null;
}
