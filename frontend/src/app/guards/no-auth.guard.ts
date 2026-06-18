import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UniversityContextService } from '../services/university-context.service';

// Prevents logged-in users from accessing login/signup pages
export const noAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const uniCtx = inject(UniversityContextService);

  if (!auth.isLoggedIn()) return true;

  const slug = route.parent?.params?.['slug'] || uniCtx.getSlug();
  if (slug) router.navigate(['/', slug, 'dashboard']);
  return false;
};
