export interface Post {
  _id: string;
  course: string;
  author: { _id: string; name: string; role: string };
  type: 'announcement' | 'material';
  title: string;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

export interface NewPost {
  type: 'announcement' | 'material';
  title: string;
  body?: string;
  fileUrl?: string | null;
  fileName?: string | null;
}
