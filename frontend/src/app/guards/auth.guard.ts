import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UniversityContextService } from '../services/university-context.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const uniCtx = inject(UniversityContextService);

  if (auth.isLoggedIn()) return true;

  const slug = route.parent?.params?.['slug'] || uniCtx.getSlug();
  router.navigate(slug ? ['/', slug, 'login'] : ['/']);
  return false;
};
