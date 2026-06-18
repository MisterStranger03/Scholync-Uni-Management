export interface Submission {
  _id: string;
  assignment: string;
  student: string | { _id: string; name: string; email: string };
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  createdAt: string;
}
