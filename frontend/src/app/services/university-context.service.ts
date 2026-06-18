import { Injectable } from '@angular/core';

// Holds the current university slug in memory + localStorage.
// Used so guards and services can resolve the slug without route params.
@Injectable({ providedIn: 'root' })
export class UniversityContextService {
  private slug: string | null = localStorage.getItem('university_slug');

  setSlug(slug: string): void {
    this.slug = slug;
    localStorage.setItem('university_slug', slug);
  }

  getSlug(): string | null {
    return this.slug;
  }

  clearSlug(): void {
    this.slug = null;
    localStorage.removeItem('university_slug');
  }
}
