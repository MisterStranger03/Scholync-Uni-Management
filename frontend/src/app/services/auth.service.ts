import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { UniversityContextService } from './university-context.service';

export interface AuthResponse {
  message: string;
  accessToken: string;
  slug: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'jwt_token';

  private isAuthenticated$ = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated: Observable<boolean> = this.isAuthenticated$.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private uniCtx: UniversityContextService
  ) {}

  async login(credentials: { email: string; password: string }): Promise<void> {
    const res = await lastValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials));
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    this.isAuthenticated$.next(true);
    this.uniCtx.setSlug(res.slug);
    this.router.navigate(['/', res.slug, 'dashboard']);
  }

  logout(): void {
    const slug = this.uniCtx.getSlug();
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated$.next(false);
    this.router.navigate(slug ? ['/', slug, 'login'] : ['/']);
  }

  isLoggedIn(): boolean  { return this.hasToken(); }
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  private hasToken(): boolean { return !!localStorage.getItem(this.TOKEN_KEY); }
}
