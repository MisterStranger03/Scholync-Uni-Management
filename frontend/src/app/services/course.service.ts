import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Course, NewCourse } from '../models/course.model';
import { Post, NewPost } from '../models/post.model';

export interface PagedResult<T> { data: T[]; total: number; page: number; pages: number; }
export interface UploadResult { url: string; originalName: string; size: number; mimetype: string; }

@Injectable({ providedIn: 'root' })
export class CourseService {
  private api = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  listCourses(search = '', page = 1): Promise<PagedResult<Course>> {
    const params: any = { page, limit: 50 };
    if (search) params['search'] = search;
    return lastValueFrom(this.http.get<PagedResult<Course>>(this.api, { params }));
  }

  listAvailableCourses(search = ''): Promise<PagedResult<Course>> {
    const params: any = { page: 1, limit: 50 };
    if (search) params['search'] = search;
    return lastValueFrom(this.http.get<PagedResult<Course>>(`${this.api}/available`, { params }));
  }

  createCourse(course: NewCourse): Promise<Course> {
    return lastValueFrom(this.http.post<Course>(this.api, course));
  }

  updateCourse(id: string, data: Partial<NewCourse>): Promise<Course> {
    return lastValueFrom(this.http.patch<Course>(`${this.api}/${id}`, data));
  }

  deleteCourse(id: string): Promise<{ message: string }> {
    return lastValueFrom(this.http.delete<{ message: string }>(`${this.api}/${id}`));
  }

  enroll(courseId: string): Promise<Course> {
    return lastValueFrom(this.http.post<Course>(`${this.api}/${courseId}/enroll`, {}));
  }

  unenroll(courseId: string): Promise<{ message: string }> {
    return lastValueFrom(this.http.delete<{ message: string }>(`${this.api}/${courseId}/enroll`));
  }

  removeStudent(courseId: string, studentId: string): Promise<{ message: string }> {
    return lastValueFrom(this.http.delete<{ message: string }>(`${this.api}/${courseId}/students/${studentId}`));
  }

  listPosts(courseId: string, search = ''): Promise<Post[]> {
    const params: any = {};
    if (search) params['search'] = search;
    return lastValueFrom(this.http.get<Post[]>(`${this.api}/${courseId}/posts`, { params }));
  }

  createPost(courseId: string, post: NewPost): Promise<Post> {
    return lastValueFrom(this.http.post<Post>(`${this.api}/${courseId}/posts`, post));
  }

  updatePost(courseId: string, postId: string, data: Partial<NewPost>): Promise<Post> {
    return lastValueFrom(this.http.patch<Post>(`${this.api}/${courseId}/posts/${postId}`, data));
  }

  deletePost(courseId: string, postId: string): Promise<{ message: string }> {
    return lastValueFrom(this.http.delete<{ message: string }>(`${this.api}/${courseId}/posts/${postId}`));
  }

  getGradebook(courseId: string): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.api}/${courseId}/gradebook`));
  }

  getMyGrades(courseId: string): Promise<any[]> {
    return lastValueFrom(this.http.get<any[]>(`${this.api}/${courseId}/my-grades`));
  }

  uploadFile(file: File): Promise<UploadResult> {
    const fd = new FormData();
    fd.append('file', file);
    return lastValueFrom(this.http.post<UploadResult>(`${environment.apiUrl}/upload`, fd));
  }
}
