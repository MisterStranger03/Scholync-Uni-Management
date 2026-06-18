export interface NewUser {
  name: string;
  email: string;
  password: string;
  dob: string;
  role: 'admin' | 'professor' | 'student';
  universityName?: string;   // required when role === 'admin'
  universityId?: string;     // required when role !== 'admin'
}
